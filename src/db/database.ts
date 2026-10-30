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

export const BRAND_NAME_REPLACEMENTS: Record<string, string> = {
  'Neutro Fabbri': 'Neutro',
  'Creme De Leite UHT 17% - Piracanjuba': 'Creme De Leite UHT 17%',
  'Pasta Baunilha - Vanilla Brasil': 'Pasta de Baunilha',
  'Leite de Coco Sococo': 'Leite de Coco Tradicional (20% gordura)',
  'Leite de coco em pó - IO': 'Leite de Coco em Pó',
  'Doce de leite Rocca': 'Doce de Leite Artesanal (Sem Amido)',
  'Xylitol': 'Xilitol'
};

export const RESTORED_BRAND_NAMES: Record<string, { newName: string; newCategory?: string }> = {
  'Base DPO 165 Premium': { newName: 'DPO 165 Premium - Aroma Italia', newCategory: 'Bases & Pré-preparos' },
  'IMO 900 + Taumatina': { newName: 'IMO 900 + Taumatina (moonsugar)', newCategory: 'Açúcares' },
  'Achocolatado em Pó': { newName: 'Nesquik / Ovomaltine', newCategory: 'Confeitaria & Inclusões' },
  'Creme de Avelã com Cacau': { newName: 'Nutella', newCategory: 'Pastas & Oleaginosas' },
  'Variegato de Creme de Avelã com Cacau': { newName: 'Variegato de Nutella', newCategory: 'Variegatos & Recheios' },
  'Cereal de Milho Açucarado': { newName: 'Sucrilhos', newCategory: 'Confeitaria & Inclusões' },
  'Xarope de Açúcar Saborizado': { newName: 'Xarope (monin)', newCategory: 'Açúcares' },
  'Biscoito Speculoos (Caramelizado)': { newName: 'Biscoff', newCategory: 'Confeitaria & Inclusões' },
  'Licor de Creme Irlandês (Irish Cream)': { newName: "Licor Bailey's", newCategory: 'Álcoois & Bebidas' },
  'Licor Triple Sec (Laranja)': { newName: 'Cointreau', newCategory: 'Álcoois & Bebidas' }
};

export const CANONICAL_NAME_REPLACEMENTS: Record<string, string> = {
  'Limão Suco': 'Suco de Limão',
  'Suco De Limão': 'Suco de Limão',
  'Polpa de Açai(10-14%)': 'Polpa de Açaí (10-14% Sólidos)',
  'Açaí (Polpa Média 12-14% Sólidos)': 'Polpa de Açaí (10-14% Sólidos)',
  'Mexerica': 'Tangerina / Mexerica',
  'Tangerina': 'Tangerina / Mexerica',
  'Laranja Suco': 'Suco de Laranja',
  'Açúcar de maçã(66% açúcar)': 'Açúcar de Maçã (66% açúcar)',
  'Pasta De Nozes 100%': 'Pasta de Nozes 100%',
  'Pasta De Castanha De Caju 100%': 'Pasta de Castanha de Caju 100%'
};

export const DUPLICATE_IDS_TO_REMOVE = ['ing_111', 'ing_215', 'ing_216', 'ing_197'];

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

    // Versão 5: Adição de 22 insumos técnicos e refinamentos de parâmetros físico-químicos
    this.version(5).stores({
      ingredients: 'id, name, category, costKg',
      recipes: 'id, name, category, targetStyle, isCustom',
      preparations: 'id, name, category, isCustom',
      settings: 'key'
    }).upgrade(async tx => {
      try {
        const currentIds = new Set((await tx.table('ingredients').toArray()).map(i => i.id));
        const newCatalogIngs = (initialIngredients as Ingredient[]).filter(i => !currentIds.has(i.id));
        if (newCatalogIngs.length > 0) {
          await tx.table('ingredients').bulkPut(newCatalogIngs);
        }
      } catch (e) {
        console.warn('Migration to v5 ingredients:', e);
      }
    });

    // Versão 6: Remoção de marcas comerciais dos nomes de insumos, receitas e pré-preparos
    this.version(6).stores({
      ingredients: 'id, name, category, costKg',
      recipes: 'id, name, category, targetStyle, isCustom',
      preparations: 'id, name, category, isCustom',
      settings: 'key'
    }).upgrade(async tx => {
      try {
        const ings = await tx.table('ingredients').toArray();
        for (const ing of ings) {
          if (BRAND_NAME_REPLACEMENTS[ing.name]) {
            await tx.table('ingredients').update(ing.id, { name: BRAND_NAME_REPLACEMENTS[ing.name] });
          }
        }
        const recs = await tx.table('recipes').toArray();
        for (const rec of recs) {
          let dirty = false;
          const updatedItems = rec.ingredients.map((item: any) => {
            if (BRAND_NAME_REPLACEMENTS[item.name]) {
              dirty = true;
              return { ...item, name: BRAND_NAME_REPLACEMENTS[item.name] };
            }
            return item;
          });
          const updatedVars = rec.variegatos?.map((v: any) => {
            if (BRAND_NAME_REPLACEMENTS[v.name]) {
              dirty = true;
              return { ...v, name: BRAND_NAME_REPLACEMENTS[v.name] };
            }
            return v;
          });
          if (dirty) {
            await tx.table('recipes').update(rec.id, {
              ingredients: updatedItems,
              ...(updatedVars ? { variegatos: updatedVars } : {})
            });
          }
        }
        const preps = await tx.table('preparations').toArray();
        for (const prep of preps) {
          let dirty = false;
          let newName = prep.name;
          if (BRAND_NAME_REPLACEMENTS[prep.name]) {
            newName = BRAND_NAME_REPLACEMENTS[prep.name];
            dirty = true;
          }
          const updatedItems = prep.ingredients?.map((item: any) => {
            if (BRAND_NAME_REPLACEMENTS[item.name]) {
              dirty = true;
              return { ...item, name: BRAND_NAME_REPLACEMENTS[item.name] };
            }
            return item;
          });
          if (dirty) {
            await tx.table('preparations').update(prep.id, {
              name: newName,
              ...(updatedItems ? { ingredients: updatedItems } : {})
            });
          }
        }
      } catch (e) {
        console.warn('Migration to v6 brand name cleaning:', e);
      }
    });

    // Versão 7: Eliminação de duplicatas de insumos e calibração físico-química canônica
    this.version(7).stores({
      ingredients: 'id, name, category, costKg',
      recipes: 'id, name, category, targetStyle, isCustom',
      preparations: 'id, name, category, isCustom',
      settings: 'key'
    }).upgrade(async tx => {
      try {
        // Remover duplicatas
        for (const dupId of DUPLICATE_IDS_TO_REMOVE) {
          await tx.table('ingredients').delete(dupId);
        }

        // Sincronizar calibração físico-química preservando custo customizado
        const catalogMap = new Map((initialIngredients as Ingredient[]).map(i => [i.id, i]));
        const ings = await tx.table('ingredients').toArray();
        for (const ing of ings) {
          const cat = catalogMap.get(ing.id);
          if (cat && !ing.isCustom) {
            await tx.table('ingredients').update(ing.id, {
              name: cat.name,
              category: cat.category,
              fat: cat.fat,
              sugars: cat.sugars,
              msnf: cat.msnf,
              otherSolids: cat.otherSolids,
              totalSolids: cat.totalSolids,
              water: cat.water,
              pod: cat.pod,
              pac: cat.pac,
              protein: cat.protein
            });
          }
        }

        // Atualizar nomes em receitas
        const recs = await tx.table('recipes').toArray();
        for (const rec of recs) {
          let dirty = false;
          const updatedItems = rec.ingredients.map((item: any) => {
            if (CANONICAL_NAME_REPLACEMENTS[item.name]) {
              dirty = true;
              return { ...item, name: CANONICAL_NAME_REPLACEMENTS[item.name] };
            }
            return item;
          });
          const updatedVars = rec.variegatos?.map((v: any) => {
            if (CANONICAL_NAME_REPLACEMENTS[v.name]) {
              dirty = true;
              return { ...v, name: CANONICAL_NAME_REPLACEMENTS[v.name] };
            }
            return v;
          });
          if (dirty) {
            await tx.table('recipes').update(rec.id, {
              ingredients: updatedItems,
              ...(updatedVars ? { variegatos: updatedVars } : {})
            });
          }
        }

        // Atualizar nomes em pré-preparos
        const preps = await tx.table('preparations').toArray();
        for (const prep of preps) {
          let dirty = false;
          let newName = prep.name;
          if (CANONICAL_NAME_REPLACEMENTS[prep.name]) {
            newName = CANONICAL_NAME_REPLACEMENTS[prep.name];
            dirty = true;
          }
          const updatedItems = prep.ingredients?.map((item: any) => {
            if (CANONICAL_NAME_REPLACEMENTS[item.name]) {
              dirty = true;
              return { ...item, name: CANONICAL_NAME_REPLACEMENTS[item.name] };
            }
            return item;
          });
          if (dirty) {
            await tx.table('preparations').update(prep.id, {
              name: newName,
              ...(updatedItems ? { ingredients: updatedItems } : {})
            });
          }
        }
      } catch (e) {
        console.warn('Migration to v7 ingredient audit:', e);
      }
    });

    // Versão 8: Estilo Gelatos de Oleaginosas e parâmetros clássicos de balanceamento
    this.version(8).stores({
      ingredients: 'id, name, category, costKg',
      recipes: 'id, name, category, targetStyle, isCustom',
      preparations: 'id, name, category, isCustom',
      settings: 'key'
    }).upgrade(async tx => {
      try {
        const nutRecipeIds = ['rec_19', 'rec_27', 'rec_31', 'rec_32', 'rec_44', 'rec_58'];
        const recs = await tx.table('recipes').toArray();
        for (const rec of recs) {
          if (nutRecipeIds.includes(rec.id) && !rec.isCustom) {
            await tx.table('recipes').update(rec.id, {
              category: 'Gelatos de Oleaginosas',
              targetStyle: 'Gelatos de Oleaginosas'
            });
          }
        }
      } catch (e) {
        console.warn('Migration to v8 nut styles:', e);
      }
    });

    // Versão 9: Subdivisão de Sorbets (Cítricos / Ácidos vs. Polposos / Densos)
    this.version(9).stores({
      ingredients: 'id, name, category, costKg',
      recipes: 'id, name, category, targetStyle, isCustom',
      preparations: 'id, name, category, isCustom',
      settings: 'key'
    }).upgrade(async tx => {
      try {
        const citricosIds = ['rec_73', 'rec_74', 'rec_78', 'rec_81', 'rec_82', 'rec_83', 'rec_87', 'rec_88', 'rec_89', 'rec_93', 'rec_95'];
        const polpososIds = ['rec_71', 'rec_72', 'rec_75', 'rec_76', 'rec_77', 'rec_79', 'rec_80', 'rec_84', 'rec_85', 'rec_86', 'rec_90', 'rec_91', 'rec_92', 'rec_94', 'rec_96'];
        const recs = await tx.table('recipes').toArray();
        for (const rec of recs) {
          if (!rec.isCustom) {
            if (citricosIds.includes(rec.id)) {
              await tx.table('recipes').update(rec.id, {
                category: 'Sorbets Cítricos / Frutas Ácidas',
                targetStyle: 'Sorbets Cítricos / Frutas Ácidas'
              });
            } else if (polpososIds.includes(rec.id)) {
              await tx.table('recipes').update(rec.id, {
                category: 'Sorbets Polposos / Frutas Densas',
                targetStyle: 'Sorbets Polposos / Frutas Densas'
              });
            }
          }
        }
      } catch (e) {
        console.warn('Migration to v9 sorbet styles:', e);
      }
    });

    // Versão 10: Restauração de marcas originais selecionadas
    this.version(10).stores({
      ingredients: 'id, name, category, costKg',
      recipes: 'id, name, category, targetStyle, isCustom',
      preparations: 'id, name, category, isCustom',
      settings: 'key'
    }).upgrade(async tx => {
      try {
        const ings = await tx.table('ingredients').toArray();
        for (const ing of ings) {
          if (RESTORED_BRAND_NAMES[ing.name]) {
            const r = RESTORED_BRAND_NAMES[ing.name];
            await tx.table('ingredients').update(ing.id, {
              name: r.newName,
              ...(r.newCategory ? { category: r.newCategory } : {})
            });
          }
        }
        const recs = await tx.table('recipes').toArray();
        for (const rec of recs) {
          let dirty = false;
          const updatedItems = rec.ingredients.map((item: any) => {
            if (RESTORED_BRAND_NAMES[item.name]) {
              dirty = true;
              return { ...item, name: RESTORED_BRAND_NAMES[item.name].newName };
            }
            return item;
          });
          const updatedVars = rec.variegatos?.map((v: any) => {
            if (RESTORED_BRAND_NAMES[v.name]) {
              dirty = true;
              return { ...v, name: RESTORED_BRAND_NAMES[v.name].newName };
            }
            return v;
          });
          if (dirty) {
            await tx.table('recipes').update(rec.id, {
              ingredients: updatedItems,
              ...(updatedVars ? { variegatos: updatedVars } : {})
            });
          }
        }
        const preps = await tx.table('preparations').toArray();
        for (const prep of preps) {
          let dirty = false;
          let newName = prep.name;
          if (RESTORED_BRAND_NAMES[prep.name]) {
            newName = RESTORED_BRAND_NAMES[prep.name].newName;
            dirty = true;
          }
          const updatedItems = prep.ingredients?.map((item: any) => {
            if (RESTORED_BRAND_NAMES[item.name]) {
              dirty = true;
              return { ...item, name: RESTORED_BRAND_NAMES[item.name].newName };
            }
            return item;
          });
          if (dirty) {
            await tx.table('preparations').update(prep.id, {
              name: newName,
              ...(updatedItems ? { ingredients: updatedItems } : {})
            });
          }
        }
      } catch (e) {
        console.warn('Migration to v10 brand restoration:', e);
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

        // Inserir novos insumos do catálogo técnico ausentes no banco do usuário
        const existingIds = new Set((await this.ingredients.toArray()).map(i => i.id));
        const newCatalogIngs = (initialIngredients as Ingredient[]).filter(i => !existingIds.has(i.id));
        if (newCatalogIngs.length > 0) {
          console.log(`Adicionando ${newCatalogIngs.length} novos insumos técnicos ao banco...`);
          await this.ingredients.bulkPut(newCatalogIngs);
        }

        // Sincronizar refinamentos técnicos de POD/PAC em itens do catálogo preservando custo customizado
        const paramSyncSetting = await this.settings.get('ingredient_technical_params_version');
        if (!paramSyncSetting || paramSyncSetting.value < 1) {
          console.log('Atualizando refinamentos técnicos de POD/PAC em insumos do catálogo...');
          const catalogMap = new Map((initialIngredients as Ingredient[]).map(i => [i.id, i]));
          const currentIngs = await this.ingredients.toArray();
          for (const ing of currentIngs) {
            const catItem = catalogMap.get(ing.id);
            if (catItem && !ing.isCustom) {
              if (ing.pac !== catItem.pac || ing.pod !== catItem.pod) {
                await this.ingredients.update(ing.id, {
                  pac: catItem.pac,
                  pod: catItem.pod
                });
              }
            }
          }
          await this.settings.put({ key: 'ingredient_technical_params_version', value: 1 });
        }

        // Sincronizar limpeza de nomes de marcas em bancos existentes
        const cleanNamesSetting = await this.settings.get('ingredient_clean_names_version');
        if (!cleanNamesSetting || cleanNamesSetting.value < 1) {
          console.log('Sincronizando limpeza de marcas nos nomes de insumos, receitas e pré-preparos...');
          const currentIngs = await this.ingredients.toArray();
          for (const ing of currentIngs) {
            if (BRAND_NAME_REPLACEMENTS[ing.name]) {
              await this.ingredients.update(ing.id, { name: BRAND_NAME_REPLACEMENTS[ing.name] });
            }
          }
          const allRecs = await this.recipes.toArray();
          for (const rec of allRecs) {
            let dirty = false;
            const updatedItems = rec.ingredients.map(item => {
              if (BRAND_NAME_REPLACEMENTS[item.name]) {
                dirty = true;
                return { ...item, name: BRAND_NAME_REPLACEMENTS[item.name] };
              }
              return item;
            });
            const updatedVars = rec.variegatos?.map(v => {
              if (BRAND_NAME_REPLACEMENTS[v.name]) {
                dirty = true;
                return { ...v, name: BRAND_NAME_REPLACEMENTS[v.name] };
              }
              return v;
            });
            if (dirty) {
              await this.recipes.update(rec.id, {
                ingredients: updatedItems,
                ...(updatedVars ? { variegatos: updatedVars } : {})
              });
            }
          }
          const allPreps = await this.preparations.toArray();
          for (const prep of allPreps) {
            let dirty = false;
            let newName = prep.name;
            if (BRAND_NAME_REPLACEMENTS[prep.name]) {
              newName = BRAND_NAME_REPLACEMENTS[prep.name];
              dirty = true;
            }
            const updatedItems = prep.ingredients?.map(item => {
              if (BRAND_NAME_REPLACEMENTS[item.name]) {
                dirty = true;
                return { ...item, name: BRAND_NAME_REPLACEMENTS[item.name] };
              }
              return item;
            });
            if (dirty) {
              await this.preparations.update(prep.id, {
                name: newName,
                ...(updatedItems ? { ingredients: updatedItems } : {})
              });
            }
          }
          await this.settings.put({ key: 'ingredient_clean_names_version', value: 1 });
        }

        // Sincronizar auditoria de insumos v7 (eliminação de duplicatas e dados canônicos)
        const auditV7Setting = await this.settings.get('ingredient_audit_v7');
        if (!auditV7Setting || auditV7Setting.value < 1) {
          console.log('Executando sincronização de auditoria de insumos v7 no banco...');
          for (const dupId of DUPLICATE_IDS_TO_REMOVE) {
            await this.ingredients.delete(dupId);
          }

          const catalogMap = new Map((initialIngredients as Ingredient[]).map(i => [i.id, i]));
          const currentIngs = await this.ingredients.toArray();
          for (const ing of currentIngs) {
            const cat = catalogMap.get(ing.id);
            if (cat && !ing.isCustom) {
              await this.ingredients.update(ing.id, {
                name: cat.name,
                category: cat.category,
                fat: cat.fat,
                sugars: cat.sugars,
                msnf: cat.msnf,
                otherSolids: cat.otherSolids,
                totalSolids: cat.totalSolids,
                water: cat.water,
                pod: cat.pod,
                pac: cat.pac,
                protein: cat.protein
              });
            }
          }

          const allRecs = await this.recipes.toArray();
          for (const rec of allRecs) {
            let dirty = false;
            const updatedItems = rec.ingredients.map(item => {
              if (CANONICAL_NAME_REPLACEMENTS[item.name]) {
                dirty = true;
                return { ...item, name: CANONICAL_NAME_REPLACEMENTS[item.name] };
              }
              return item;
            });
            const updatedVars = rec.variegatos?.map(v => {
              if (CANONICAL_NAME_REPLACEMENTS[v.name]) {
                dirty = true;
                return { ...v, name: CANONICAL_NAME_REPLACEMENTS[v.name] };
              }
              return v;
            });
            if (dirty) {
              await this.recipes.update(rec.id, {
                ingredients: updatedItems,
                ...(updatedVars ? { variegatos: updatedVars } : {})
              });
            }
          }

          const allPreps = await this.preparations.toArray();
          for (const prep of allPreps) {
            let dirty = false;
            let newName = prep.name;
            if (CANONICAL_NAME_REPLACEMENTS[prep.name]) {
              newName = CANONICAL_NAME_REPLACEMENTS[prep.name];
              dirty = true;
            }
            const updatedItems = prep.ingredients?.map(item => {
              if (CANONICAL_NAME_REPLACEMENTS[item.name]) {
                dirty = true;
                return { ...item, name: CANONICAL_NAME_REPLACEMENTS[item.name] };
              }
              return item;
            });
            if (dirty) {
              await this.preparations.update(prep.id, {
                name: newName,
                ...(updatedItems ? { ingredients: updatedItems } : {})
              });
            }
          }
          await this.settings.put({ key: 'ingredient_audit_v7', value: 1 });
        }
      }

      // Verificação de sincronização v8: Estilo Gelatos de Oleaginosas
      const stylesUpdated = await this.settings.get('styles_updated_v8');
      if (!stylesUpdated) {
        const nutRecipeIds = ['rec_19', 'rec_27', 'rec_31', 'rec_32', 'rec_44', 'rec_58'];
        const allRecs = await this.recipes.toArray();
        for (const rec of allRecs) {
          if (nutRecipeIds.includes(rec.id) && !rec.isCustom) {
            await this.recipes.update(rec.id, {
              category: 'Gelatos de Oleaginosas',
              targetStyle: 'Gelatos de Oleaginosas'
            });
          }
        }
        await this.settings.put({ key: 'styles_updated_v8', value: 1 });
      }

      // Verificação de sincronização v9: Subdivisão de Sorbets
      const sorbetsUpdated = await this.settings.get('sorbets_updated_v9');
      if (!sorbetsUpdated) {
        const citricosIds = ['rec_73', 'rec_74', 'rec_78', 'rec_81', 'rec_82', 'rec_83', 'rec_87', 'rec_88', 'rec_89', 'rec_93', 'rec_95'];
        const polpososIds = ['rec_71', 'rec_72', 'rec_75', 'rec_76', 'rec_77', 'rec_79', 'rec_80', 'rec_84', 'rec_85', 'rec_86', 'rec_90', 'rec_91', 'rec_92', 'rec_94', 'rec_96'];
        const allRecs = await this.recipes.toArray();
        for (const rec of allRecs) {
          if (!rec.isCustom) {
            if (citricosIds.includes(rec.id)) {
              await this.recipes.update(rec.id, {
                category: 'Sorbets Cítricos / Frutas Ácidas',
                targetStyle: 'Sorbets Cítricos / Frutas Ácidas'
              });
            } else if (polpososIds.includes(rec.id)) {
              await this.recipes.update(rec.id, {
                category: 'Sorbets Polposos / Frutas Densas',
                targetStyle: 'Sorbets Polposos / Frutas Densas'
              });
            }
          }
        }
        await this.settings.put({ key: 'sorbets_updated_v9', value: 1 });
      }

      // Verificação de sincronização v10: Restauração de marcas nos insumos, receitas e pré-preparos
      const brandRestoreSetting = await this.settings.get('brands_restored_v10');
      if (!brandRestoreSetting) {
        console.log('Restaurando marcas selecionadas nos insumos, receitas e pré-preparos...');
        const currentIngs = await this.ingredients.toArray();
        for (const ing of currentIngs) {
          if (RESTORED_BRAND_NAMES[ing.name]) {
            const r = RESTORED_BRAND_NAMES[ing.name];
            await this.ingredients.update(ing.id, {
              name: r.newName,
              ...(r.newCategory ? { category: r.newCategory } : {})
            });
          }
        }
        const allRecs = await this.recipes.toArray();
        for (const rec of allRecs) {
          let dirty = false;
          const updatedItems = rec.ingredients.map(item => {
            if (RESTORED_BRAND_NAMES[item.name]) {
              dirty = true;
              return { ...item, name: RESTORED_BRAND_NAMES[item.name].newName };
            }
            return item;
          });
          const updatedVars = rec.variegatos?.map(v => {
            if (RESTORED_BRAND_NAMES[v.name]) {
              dirty = true;
              return { ...v, name: RESTORED_BRAND_NAMES[v.name].newName };
            }
            return v;
          });
          if (dirty) {
            await this.recipes.update(rec.id, {
              ingredients: updatedItems,
              ...(updatedVars ? { variegatos: updatedVars } : {})
            });
          }
        }
        const allPreps = await this.preparations.toArray();
        for (const prep of allPreps) {
          let dirty = false;
          let newName = prep.name;
          if (RESTORED_BRAND_NAMES[prep.name]) {
            newName = RESTORED_BRAND_NAMES[prep.name].newName;
            dirty = true;
          }
          const updatedItems = prep.ingredients?.map(item => {
            if (RESTORED_BRAND_NAMES[item.name]) {
              dirty = true;
              return { ...item, name: RESTORED_BRAND_NAMES[item.name].newName };
            }
            return item;
          });
          if (dirty) {
            await this.preparations.update(prep.id, {
              name: newName,
              ...(updatedItems ? { ingredients: updatedItems } : {})
            });
          }
        }
        await this.settings.put({ key: 'brands_restored_v10', value: 1 });
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
