import { Preparation, Ingredient } from '../types/gelato';
import { db } from '../db/database';

export interface CalculatedPreparationProfile {
  totalGrams: number;
  sugars: number;      // 0..1
  fat: number;         // 0..1
  msnf: number;        // 0..1
  otherSolids: number; // 0..1
  totalSolids: number; // 0..1
  water: number;       // 0..1
  pod: number;
  pac: number;
  protein: number;     // 0..1
  costKg: number;
  hasAllergen: boolean;
  allergenDetails: string[];
}

/**
 * Calcula os parâmetros físico-químicos, nutricionais e de custo
 * ponderados de um pré-preparo / variegato a partir de seus ingredientes.
 */
export function calculatePreparationNutrients(
  prep: Pick<Preparation, 'name' | 'category' | 'ingredients'>,
  availableIngredients: Ingredient[]
): CalculatedPreparationProfile {
  const ingMap = new Map<string, Ingredient>();
  for (const ing of availableIngredients) {
    if (ing.name) {
      ingMap.set(ing.name.trim().toLowerCase(), ing);
    }
  }

  let totalGrams = 0;
  let sumSugars = 0;
  let sumFat = 0;
  let sumMsnf = 0;
  let sumOtherSolids = 0;
  let sumTotalSolids = 0;
  let sumWater = 0;
  let sumPod = 0;
  let sumPac = 0;
  let sumProtein = 0;
  let sumCost = 0;
  let hasAllergen = false;
  const allergenDetailsSet = new Set<string>();

  for (const item of prep.ingredients) {
    const g = typeof item.grams === 'number' ? item.grams : Number(item.grams);
    if (!item.name || isNaN(g) || g <= 0) continue;

    totalGrams += g;
    const ing = ingMap.get(item.name.trim().toLowerCase());

    if (ing) {
      sumSugars += g * (ing.sugars || 0);
      sumFat += g * (ing.fat || 0);
      sumMsnf += g * (ing.msnf || 0);
      sumOtherSolids += g * (ing.otherSolids || 0);
      sumTotalSolids += g * (ing.totalSolids || 0);
      sumWater += g * (ing.water || 0);
      sumPod += g * (ing.pod || 0);
      sumPac += g * (ing.pac || 0);
      sumProtein += g * (ing.protein || 0);
      sumCost += (g * (ing.costKg || 0)) / 1000;

      if (ing.hasAllergen) {
        hasAllergen = true;
      }
      if (ing.allergenDetails && ing.allergenDetails.length > 0) {
        ing.allergenDetails.forEach(d => allergenDetailsSet.add(d));
      }
    }
  }

  const safeTotal = totalGrams > 0 ? totalGrams : 1000;
  const round4 = (v: number) => Math.round(v * 10000) / 10000;
  const round2 = (v: number) => Math.round(v * 100) / 100;

  const pctSugars = round4(sumSugars / safeTotal);
  const pctFat = round4(sumFat / safeTotal);
  const pctMsnf = round4(sumMsnf / safeTotal);
  const pctOtherSolids = round4(sumOtherSolids / safeTotal);
  const pctTotalSolids = round4(sumTotalSolids / safeTotal);
  const pctWater = round4(totalGrams > 0 ? Math.max(0, 1 - pctTotalSolids) : 0);
  const relPod = round4(sumPod / safeTotal);
  const relPac = round4(sumPac / safeTotal);
  const pctProtein = round4(sumProtein / safeTotal);
  const costKg = round2((sumCost * 1000) / safeTotal);

  return {
    totalGrams,
    sugars: pctSugars,
    fat: pctFat,
    msnf: pctMsnf,
    otherSolids: pctOtherSolids,
    totalSolids: pctTotalSolids,
    water: pctWater,
    pod: relPod,
    pac: relPac,
    protein: pctProtein,
    costKg,
    hasAllergen,
    allergenDetails: Array.from(allergenDetailsSet),
  };
}

/**
 * Sincroniza um pré-preparo / variegato para o banco de dados de Insumos (`db.ingredients`).
 * - Atualiza o insumo existente (se já houver por preparationId ou por nome)
 * - Ou cria um novo insumo caso não exista
 * - Propaga renomeações caso o nome tenha mudado
 */
export async function syncPreparationToIngredient(
  prep: Preparation,
  availableIngredients: Ingredient[],
  previousName?: string
): Promise<{ ingredient: Ingredient; isNew: boolean }> {
  const profile = calculatePreparationNutrients(prep, availableIngredients);

  const cleanName = prep.name.trim();
  const lowerName = cleanName.toLowerCase();
  const lowerPrevName = previousName ? previousName.trim().toLowerCase() : undefined;

  // 1. Procurar insumo existente por preparationId, nome atual ou nome anterior
  let targetIng = availableIngredients.find(i => i.preparationId && i.preparationId === prep.id);

  if (!targetIng) {
    targetIng = availableIngredients.find(i => i.name.trim().toLowerCase() === lowerName);
  }

  if (!targetIng && lowerPrevName) {
    targetIng = availableIngredients.find(i => i.name.trim().toLowerCase() === lowerPrevName);
  }

  const defaultCategory = prep.category === 'Variegato' ? 'Variegatos & Recheios' : 'Bases & Pré-preparos';

  if (targetIng) {
    // Insumo existente: atualizar dados mantendo ID e categoria apropriada
    const updatedIng: Ingredient = {
      ...targetIng,
      name: cleanName,
      category: targetIng.category || defaultCategory,
      costKg: profile.costKg,
      sugars: profile.sugars,
      fat: profile.fat,
      msnf: profile.msnf,
      otherSolids: profile.otherSolids,
      totalSolids: profile.totalSolids,
      water: profile.water,
      pod: profile.pod,
      pac: profile.pac,
      protein: profile.protein,
      hasAllergen: profile.hasAllergen,
      allergenDetails: profile.allergenDetails,
      preparationId: prep.id,
    };

    await db.ingredients.put(updatedIng);

    // Se o nome foi alterado, atualizar referências em receitas
    if (previousName && previousName.trim() !== cleanName) {
      await updateIngredientReferencesAcrossRecipes(previousName.trim(), cleanName);
    }

    return { ingredient: updatedIng, isNew: false };
  } else {
    // Insumo novo: cadastrar na tabela de insumos
    const newId = `ing_prep_${Date.now()}`;
    const newIng: Ingredient = {
      id: newId,
      name: cleanName,
      category: defaultCategory,
      costKg: profile.costKg,
      sugars: profile.sugars,
      fat: profile.fat,
      msnf: profile.msnf,
      otherSolids: profile.otherSolids,
      totalSolids: profile.totalSolids,
      water: profile.water,
      pod: profile.pod,
      pac: profile.pac,
      protein: profile.protein,
      hasAllergen: profile.hasAllergen,
      allergenDetails: profile.allergenDetails,
      isCustom: true,
      preparationId: prep.id,
    };

    await db.ingredients.put(newIng);
    return { ingredient: newIng, isNew: true };
  }
}

/**
 * Propaga a renomeação de um insumo/pré-preparo nas receitas do banco
 */
async function updateIngredientReferencesAcrossRecipes(oldName: string, newName: string) {
  try {
    const recipes = await db.recipes.toArray();
    for (const rec of recipes) {
      let modified = false;
      const updatedIngredients = rec.ingredients.map(item => {
        if (item.name.trim().toLowerCase() === oldName.toLowerCase()) {
          modified = true;
          return { ...item, name: newName };
        }
        return item;
      });

      let updatedVariegatos = rec.variegatos;
      if (rec.variegatos && rec.variegatos.length > 0) {
        updatedVariegatos = rec.variegatos.map(item => {
          if (item.name.trim().toLowerCase() === oldName.toLowerCase()) {
            modified = true;
            return { ...item, name: newName };
          }
          return item;
        });
      }

      if (modified) {
        await db.recipes.update(rec.id, {
          ingredients: updatedIngredients,
          variegatos: updatedVariegatos,
        });
      }
    }
  } catch (err) {
    console.warn('Erro ao atualizar referências do ingrediente em receitas:', err);
  }
}

/**
 * Remove o insumo customizado associado ao pré-preparo quando este for deletado
 */
export async function removeLinkedIngredientForPreparation(prep: Preparation) {
  try {
    const ingredients = await db.ingredients.toArray();
    const linked = ingredients.find(
      i => (i.preparationId && i.preparationId === prep.id) ||
           (i.isCustom && i.name.trim().toLowerCase() === prep.name.trim().toLowerCase())
    );
    if (linked) {
      await db.ingredients.delete(linked.id);
    }
  } catch (err) {
    console.warn('Erro ao remover insumo vinculado à preparação:', err);
  }
}

/**
 * Ressincroniza em lote todos os pré-preparos existentes com a tabela de insumos
 */
export async function syncAllPreparationsToIngredients(
  preparations: Preparation[],
  availableIngredients: Ingredient[]
): Promise<{ updatedCount: number; createdCount: number }> {
  let updatedCount = 0;
  let createdCount = 0;
  let currentIngredients = [...availableIngredients];

  for (const prep of preparations) {
    if (!prep.name || !prep.ingredients || prep.ingredients.length === 0) continue;
    const res = await syncPreparationToIngredient(prep, currentIngredients);
    if (res.isNew) {
      createdCount++;
      currentIngredients.push(res.ingredient);
    } else {
      updatedCount++;
      currentIngredients = currentIngredients.map(i => i.id === res.ingredient.id ? res.ingredient : i);
    }
  }

  return { updatedCount, createdCount };
}

