import Dexie, { type EntityTable } from 'dexie';
import { Ingredient, Recipe, Preparation, StyleStandard } from '../types/gelato';

import initialIngredients from '../data/ingredients.json';
import initialRecipes from '../data/recipes.json';
import initialStyles from '../data/styles.json';
import initialPreparations from '../data/preparations.json';
import { DEFAULT_PRICING } from '../core/calculator';
import { STORAGE_KEY as PRICING_STORAGE_KEY, PRICING_UPDATED_EVENT } from '../core/pricingStorage';
import { THEME_STORAGE_KEY, THEME_CHANGE_EVENT } from '../core/theme';

export interface AppSetting {
  key: string;
  value: any;
}

export interface BackupResult {
  recipesCount: number;
  ingredientsCount: number;
  pricingImported: boolean;
  themeImported: boolean;
}

export class GelatoDatabase extends Dexie {
  ingredients!: EntityTable<Ingredient, 'id'>;
  recipes!: EntityTable<Recipe, 'id'>;
  preparations!: EntityTable<Preparation, 'id'>;
  settings!: EntityTable<AppSetting, 'key'>;

  constructor() {
    super('GelatoBalancerDB');

    // Versão 1: Esquema original
    this.version(1).stores({
      ingredients: 'id, name, category, costKg',
      recipes: 'id, name, category, targetStyle, isCustom',
      preparations: 'name, category',
      settings: 'key'
    });

    // Versão 2: Deleta a tabela antiga preparations cujo primary key era 'name'
    // No IndexedDB, mudar a primary key exige deletar a tabela antes de recriá-la
    this.version(2).stores({
      ingredients: 'id, name, category, costKg',
      recipes: 'id, name, category, targetStyle, isCustom',
      preparations: null,
      settings: 'key'
    });

    // Versão 3: Recria a tabela preparations com primary key 'id'
    this.version(3).stores({
      ingredients: 'id, name, category, costKg',
      recipes: 'id, name, category, targetStyle, isCustom',
      preparations: 'id, name, category, isCustom',
      settings: 'key'
    }).upgrade(async tx => {
      try {
        for (const p of initialPreparations) {
          await tx.table('preparations').put(p);
        }
      } catch (e) {
        console.warn('Migration to v3 preparations:', e);
      }
    });

    // Versão 4: Atualização taxonômica das categorias dos 190 insumos
    this.version(4).stores({
      ingredients: 'id, name, category, costKg',
      recipes: 'id, name, category, targetStyle, isCustom',
      preparations: 'id, name, category, isCustom',
      settings: 'key'
    }).upgrade(async tx => {
      try {
        const initialMap = new Map((initialIngredients as Ingredient[]).map(i => [i.id, i.category]));
        const currentIngs = await tx.table('ingredients').toArray();
        for (const ing of currentIngs) {
          const newCat = initialMap.get(ing.id);
          if (newCat && newCat !== ing.category) {
            await tx.table('ingredients').update(ing.id, { category: newCat });
          }
        }
      } catch (e) {
        console.warn('Migration to v4 ingredient categories:', e);
      }
    });
  }

  async initializeSeedData(): Promise<void> {
    try {
      await this.open();
    } catch (openErr) {
      console.warn('Erro ao abrir Dexie diretamente, iniciando auto-reparo do banco:', openErr);
      try {
        await Dexie.delete('GelatoBalancerDB');
        await this.open();
        console.log('GelatoBalancerDB recriado e aberto com sucesso.');
      } catch (delErr) {
        console.error('Erro crítico no IndexedDB:', delErr);
        throw delErr;
      }
    }

    try {
      // 1. Insumos
      const ingCount = await this.ingredients.count();
      if (ingCount === 0) {
        console.log('Populando insumos iniciais...');
        await this.ingredients.bulkPut(initialIngredients as Ingredient[]);
      } else {
        // Sincronizar categorias atualizadas para insumos do catálogo inicial sem perder custo customizado
        const catSyncSetting = await this.settings.get('ingredient_categories_version');
        if (!catSyncSetting || catSyncSetting.value < 2) {
          console.log('Sincronizando novas categorias de insumos no banco...');
          const initialMap = new Map((initialIngredients as Ingredient[]).map(i => [i.id, i.category]));
          const allCurrentIngs = await this.ingredients.toArray();
          for (const ing of allCurrentIngs) {
            const newCat = initialMap.get(ing.id);
            if (newCat && newCat !== ing.category) {
              await this.ingredients.update(ing.id, { category: newCat });
            }
          }
          await this.settings.put({ key: 'ingredient_categories_version', value: 2 });
        }
      }

      // 2. Receitas
      const recCount = await this.recipes.count();
      if (recCount === 0) {
        console.log('Populando receitas iniciais...');
        await this.recipes.bulkPut(initialRecipes as Recipe[]);
      }

      // 3. Pré-preparos & Variegatos
      const prepCount = await this.preparations.count();
      if (prepCount < initialPreparations.length) {
        console.log('Populando/atualizando pré-preparos...');
        await this.preparations.bulkPut(initialPreparations as Preparation[]);
      }

      // 4. Parâmetros de Precificação
      const settingsCount = await this.settings.count();
      if (settingsCount === 0) {
        await this.settings.put({ key: 'pricing', value: DEFAULT_PRICING });
      }
    } catch (seedErr) {
      console.error('Erro durante o povoamento inicial de dados:', seedErr);
    }
  }

  async exportFullBackup(): Promise<string> {
    const ingredients = await this.ingredients.toArray();
    const recipes = await this.recipes.toArray();
    const preparations = await this.preparations.toArray();
    const settings = await this.settings.toArray();

    // Capturar também parâmetros de precificação do usuário (localStorage)
    let pricingParams = null;
    try {
      const rawPricing = localStorage.getItem(PRICING_STORAGE_KEY);
      if (rawPricing) {
        pricingParams = JSON.parse(rawPricing);
      }
    } catch (e) {
      console.warn('Erro ao ler pricingParams para backup:', e);
    }

    // Capturar tema
    let themeMode = null;
    try {
      themeMode = localStorage.getItem(THEME_STORAGE_KEY);
    } catch (e) {
      console.warn('Erro ao ler themeMode para backup:', e);
    }

    const backup = {
      version: 3,
      exportedAt: new Date().toISOString(),
      ingredients,
      recipes,
      preparations,
      settings,
      pricingParams,
      themeMode
    };

    return JSON.stringify(backup, null, 2);
  }

  async importBackup(jsonString: string, mode: 'merge' | 'replace' = 'merge'): Promise<BackupResult> {
    const data = JSON.parse(jsonString);

    if (!data.recipes || !data.ingredients) {
      throw new Error('Formato de backup inválido: campos de receitas e ingredientes ausentes.');
    }

    await this.transaction('rw', this.ingredients, this.recipes, this.preparations, this.settings, async () => {
      if (mode === 'replace') {
        await this.ingredients.clear();
        await this.recipes.clear();
        await this.preparations.clear();
      }

      await this.ingredients.bulkPut(data.ingredients);
      await this.recipes.bulkPut(data.recipes);

      if (data.preparations) {
        await this.preparations.bulkPut(data.preparations);
      }
      if (data.settings) {
        for (const s of data.settings) {
          await this.settings.put(s);
        }
      }
    });

    let pricingImported = false;
    let themeImported = false;

    // Restaurar custos fixos e taxas Cielo caso existam no backup
    if (data.pricingParams && typeof window !== 'undefined') {
      try {
        localStorage.setItem(PRICING_STORAGE_KEY, JSON.stringify(data.pricingParams));
        window.dispatchEvent(new Event(PRICING_UPDATED_EVENT));
        pricingImported = true;
      } catch (err) {
        console.warn('Erro ao restaurar pricingParams do backup:', err);
      }
    }

    // Restaurar preferência de tema caso exista no backup
    if (data.themeMode && typeof window !== 'undefined') {
      try {
        localStorage.setItem(THEME_STORAGE_KEY, data.themeMode);
        window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
        themeImported = true;
      } catch (err) {
        console.warn('Erro ao restaurar themeMode do backup:', err);
      }
    }

    return {
      recipesCount: data.recipes.length,
      ingredientsCount: data.ingredients.length,
      pricingImported,
      themeImported
    };
  }

  async restoreFactoryDefaults(): Promise<void> {
    await this.transaction('rw', this.ingredients, this.recipes, this.preparations, this.settings, async () => {
      await this.ingredients.clear();
      await this.recipes.clear();
      await this.preparations.clear();
      await this.settings.clear();

      await this.ingredients.bulkPut(initialIngredients as Ingredient[]);
      await this.recipes.bulkPut(initialRecipes as Recipe[]);
      await this.preparations.bulkPut(initialPreparations as Preparation[]);
      await this.settings.put({ key: 'pricing', value: DEFAULT_PRICING });
    });

    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(PRICING_STORAGE_KEY);
        window.dispatchEvent(new Event(PRICING_UPDATED_EVENT));
      } catch (e) {
        console.warn('Erro ao redefinir pricingParams no reset:', e);
      }
    }
  }
}

export const db = new GelatoDatabase();
export const stylesDataMap: Record<string, StyleStandard> = initialStyles as Record<string, StyleStandard>;
