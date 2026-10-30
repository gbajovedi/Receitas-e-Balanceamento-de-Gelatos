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
  preparations!: EntityTable<Preparation, 'name'>;
  settings!: EntityTable<AppSetting, 'key'>;

  constructor() {
    super('GelatoBalancerDB');
    this.version(1).stores({
      ingredients: 'id, name, category, costKg',
      recipes: 'id, name, category, targetStyle, isCustom',
      preparations: 'name, category',
      settings: 'key'
    });
  }

  async initializeSeedData(): Promise<void> {
    const count = await this.recipes.count();
    if (count === 0) {
      console.log('Seeding initial data into IndexedDB...');
      await this.transaction('rw', this.ingredients, this.recipes, this.preparations, this.settings, async () => {
        // Seed ingredients
        await this.ingredients.bulkPut(initialIngredients as Ingredient[]);
        // Seed recipes
        await this.recipes.bulkPut(initialRecipes as Recipe[]);
        // Seed preparations
        await this.preparations.bulkPut(initialPreparations as Preparation[]);
        // Seed default pricing settings
        await this.settings.put({ key: 'pricing', value: DEFAULT_PRICING });
      });
      console.log('IndexedDB seeded successfully!');
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
      version: 2,
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
