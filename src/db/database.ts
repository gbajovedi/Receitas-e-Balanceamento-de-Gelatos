import Dexie, { type EntityTable } from 'dexie';
import { Ingredient, Recipe, Preparation, StyleStandard } from '../types/gelato';

import initialIngredients from '../data/ingredients.json';
import initialRecipes from '../data/recipes.json';
import initialStyles from '../data/styles.json';
import initialPreparations from '../data/preparations.json';
import { DEFAULT_PRICING } from '../core/calculator';

export interface AppSetting {
  key: string;
  value: any;
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

    const backup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      ingredients,
      recipes,
      preparations,
      settings
    };

    return JSON.stringify(backup, null, 2);
  }

  async importBackup(jsonString: string, mode: 'merge' | 'replace' = 'merge'): Promise<{ recipesCount: number, ingredientsCount: number }> {
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

    return {
      recipesCount: data.recipes.length,
      ingredientsCount: data.ingredients.length
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
  }
}

export const db = new GelatoDatabase();
export const stylesDataMap: Record<string, StyleStandard> = initialStyles as Record<string, StyleStandard>;
