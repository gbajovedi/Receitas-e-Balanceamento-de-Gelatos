import {
  Ingredient,
  StyleStandard,
  RecipeItem,
  VariegatoItem,
  BatchAnalysis,
  NutrientValidation,
  PricingSettings,
  SandinessRisk,
  CorvittoMetrics
} from '../types/gelato';

export const DEFAULT_PRICING: PricingSettings = {
  tubWeightGrams: 500,
  tubPackagingCost: 1.50,
  indirectOverheadPerTub: 5.40,
  targetProfitMarginPercent: 40,
  cardFeePercent: 3.5,
  salesTaxPercent: 0
};

export function calculateBatchAnalysis(
  items: RecipeItem[],
  variegatos: VariegatoItem[] = [],
  style: StyleStandard,
  ingredientsMap: Map<string, Ingredient>,
  pricing: PricingSettings = DEFAULT_PRICING
): BatchAnalysis {
  let totalCaldaGrams = 0;
  let totalCost = 0;
  let totalSugars = 0;
  let totalFat = 0;
  let totalMsnf = 0;
  let totalOtherSolids = 0;
  let totalSolids = 0;
  let totalWater = 0;
  let totalPod = 0;
  let totalPac = 0;
  let totalProtein = 0;

  const allergenItems: string[] = [];
  let containsGluten = false;
  let containsLactose = false;

  for (const item of items) {
    if (!item.name || item.grams <= 0) continue;
    const ing = ingredientsMap.get(item.name.toLowerCase().trim());
    const g = item.grams;
    totalCaldaGrams += g;

    if (ing) {
      totalSugars += g * ing.sugars;
      totalFat += g * ing.fat;
      totalMsnf += g * ing.msnf;
      totalOtherSolids += g * ing.otherSolids;
      totalSolids += g * ing.totalSolids;
      totalWater += g * ing.water;
      totalPod += g * ing.pod;
      totalPac += g * ing.pac;
      totalProtein += g * ing.protein;
      totalCost += (g * ing.costKg) / 1000;

      if (ing.hasAllergen) {
        allergenItems.push(ing.name.toUpperCase());
      }
      if (ing.msnf > 0 || /leite|creme|queijo|lactose/i.test(ing.name)) {
        containsLactose = true;
      }
      if (/(trigo|croissant|biscoff|biscoito|panettone|aveia|sucrilhos|ovomaltine|malte)/i.test(ing.name)) {
        containsGluten = true;
      }
    }
  }

  const safeWeight = totalCaldaGrams > 0 ? totalCaldaGrams : 1000;
  const scale = 1000 / safeWeight;

  // Normalized percentages (0 to 1) and relative POD/PAC (per 1000g)
  const pctSugars = totalCaldaGrams > 0 ? totalSugars / totalCaldaGrams : 0;
  const pctFat = totalCaldaGrams > 0 ? totalFat / totalCaldaGrams : 0;
  const pctMsnf = totalCaldaGrams > 0 ? totalMsnf / totalCaldaGrams : 0;
  const pctOtherSolids = totalCaldaGrams > 0 ? totalOtherSolids / totalCaldaGrams : 0;
  const pctTotalSolids = totalCaldaGrams > 0 ? totalSolids / totalCaldaGrams : 0;
  const pctWater = totalCaldaGrams > 0 ? totalWater / totalCaldaGrams : 0;
  const relPod = totalCaldaGrams > 0 ? (totalPod * 1000) / totalCaldaGrams : 0;
  const relPac = totalCaldaGrams > 0 ? (totalPac * 1000) / totalCaldaGrams : 0;
  const pctProtein = totalCaldaGrams > 0 ? totalProtein / totalCaldaGrams : 0;

  // Validation function
  const validate = (val: number, min: number, max: number, isPercent = true): NutrientValidation => {
    // Tolerância para arredondamento
    const factor = isPercent ? 10000 : 10;
    const v = Math.round(val * factor) / factor;
    const mi = Math.round(min * factor) / factor;
    const ma = Math.round(max * factor) / factor;

    let status: 'Ok' | 'Baixo' | 'Alto' = 'Ok';
    if (v < mi) status = 'Baixo';
    else if (v > ma) status = 'Alto';
    return { val, min, max, status };
  };

  const validations = {
    sugars: validate(pctSugars, style.min.sugars, style.max.sugars),
    fat: validate(pctFat, style.min.fat, style.max.fat),
    msnf: validate(pctMsnf, style.min.msnf, style.max.msnf),
    otherSolids: validate(pctOtherSolids, style.min.otherSolids, style.max.otherSolids),
    totalSolids: validate(pctTotalSolids, style.min.totalSolids, style.max.totalSolids),
    water: validate(pctWater, style.min.water, style.max.water),
    pod: validate(relPod, style.min.pod, style.max.pod, false),
    pac: validate(relPac, style.min.pac, style.max.pac, false),
    protein: (style.max.protein > 0 && style.name === 'Gelatos Proteicos')
      ? validate(pctProtein, style.min.protein, style.max.protein)
      : { val: pctProtein, min: 0, max: 0, status: 'Ok' as const }
  };

  const isBalanced = Object.values(validations).every(v => v.status === 'Ok');

  // Temperatura de Serviço / Vitrine (°C) - Modelo Crioscópico de Espatulabilidade (Leighton / Corvitto)
  // Ponto de equilíbrio térmico onde ~75% a 78% da água está congelada em microcristais e ~22% a 25% permanece líquida para espatulabilidade perfeita.
  let servingTemperature = -12.0;
  if (relPac > 0 && pctWater > 0.15) {
    const deltaSugars = (relPac / (pctWater * 1000)) * 28.5;
    const deltaMsnfSalts = pctMsnf * 10.0;
    const deltaFatHardening = (pctFat * 100) * 0.05;
    const calculatedTemp = -(deltaSugars + deltaMsnfSalts - deltaFatHardening);
    servingTemperature = Math.max(-18.0, Math.min(-8.0, calculatedTemp));
  }

  // 1. Risco de Arenosidade Dinâmico (Fórmula de Caviezel)
  // SLNG máximo seguro para o volume de água disponível: SLNG_máx = pctWater / 6
  const maxSafeMsnf = pctWater > 0 ? (pctWater / 6) : 0.105;
  const isSandinessAtRisk = pctMsnf > 0.02 && (pctMsnf > (maxSafeMsnf + 0.002));
  const sandinessRisk: SandinessRisk = {
    maxSafeMsnf,
    currentMsnf: pctMsnf,
    isAtRisk: isSandinessAtRisk,
    excessPct: Math.max(0, pctMsnf - maxSafeMsnf)
  };

  // 2. Diagnóstico Corvitto de PAC na Água Livre (PAC en agua libre)
  // PAC por kg de água pura = relPac / pctWater
  const pacWater = pctWater > 0.1 ? Math.round(relPac / pctWater) : Math.round(relPac);

  let vitrineStatus: 'firme' | 'ideal' | 'macio' = 'ideal';
  let vitrineLabel = 'Ideal p/ Vitrine (-12°C)';
  if (pacWater < 380) {
    vitrineStatus = 'firme';
    vitrineLabel = 'Firme na Vitrine (-12°C)';
  } else if (pacWater > 425) {
    vitrineStatus = 'macio';
    vitrineLabel = 'Macia / Fusão Rápida';
  }

  let freezerStatus: 'duro' | 'firme' | 'colher' | 'muito_macio' = 'firme';
  let freezerLabel = 'Firme (-18°C) — aguardar ~10min';
  let freezerAdvice = 'Para consumo em casa (-18°C), retire do freezer 10 a 15 minutos antes de servir.';
  const idealFreezerPacWater = 460;
  const targetRelPacForFreezer = Math.round(idealFreezerPacWater * pctWater);
  const neededPacForFreezer = Math.max(0, targetRelPacForFreezer - Math.round(relPac));

  if (pacWater < 420) {
    freezerStatus = 'duro';
    freezerLabel = 'Rígido (-18°C) — aguardar 15min';
    freezerAdvice = `Para ponto de colher imediato no freezer doméstico (-18°C), eleve +${neededPacForFreezer} de PAC (ex: substitua ~${Math.round(neededPacForFreezer * 0.55)}g de sacarose por dextrose).`;
  } else if (pacWater >= 420 && pacWater < 450) {
    freezerStatus = 'firme';
    freezerLabel = 'Firme (-18°C) — aguardar ~10min';
    freezerAdvice = `Fórmula de vitrine padrão. Para ponto de colher imediato no freezer (-18°C), adicione +${neededPacForFreezer} de PAC.`;
  } else if (pacWater >= 450 && pacWater <= 490) {
    freezerStatus = 'colher';
    freezerLabel = 'Ponto de Colher Direto (-18°C)';
    freezerAdvice = 'Calda perfeitamente equilibrada para consumo doméstico imediato direto do freezer!';
  } else {
    freezerStatus = 'muito_macio';
    freezerLabel = 'Muito Macio (-18°C)';
    freezerAdvice = 'PAC na água muito elevado para freezer doméstico; risco de derretimento acelerado.';
  }

  const corvittoMetrics: CorvittoMetrics = {
    pacWater,
    vitrineStatus,
    vitrineLabel,
    freezerStatus,
    freezerLabel,
    freezerAdvice,
    neededPacForFreezer
  };

  // Allergens Label
  let allergensLabel = "";
  if (allergenItems.length > 0) {
    const uniqueAllergens = Array.from(new Set(allergenItems)).join(", ");
    allergensLabel = `CONTÉM: ${uniqueAllergens}.`;
  } else {
    allergensLabel = "NÃO CONTÉM ALERGÊNICOS DIRETOS.";
  }
  allergensLabel += containsLactose ? " CONTÉM LACTOSE." : " NÃO CONTÉM LACTOSE.";
  allergensLabel += containsGluten ? " CONTÉM GLÚTEN." : " NÃO CONTÉM GLÚTEN.";

  // Post-Production (Variegatos / Mesclas) & Costing
  let totalVariegatoGrams = 0;
  let totalVariegatoCost = 0;

  for (const v of variegatos) {
    if (!v.name || v.grams <= 0) continue;
    totalVariegatoGrams += v.grams;
    const ing = ingredientsMap.get(v.name.toLowerCase().trim());
    const costKg = v.costKg ?? (ing ? ing.costKg : 0);
    totalVariegatoCost += (v.grams * costKg) / 1000;
  }

  const finalWeightGrams = totalCaldaGrams + totalVariegatoGrams;
  const totalBatchCost = totalCost + totalVariegatoCost;
  const caldaCostKg = totalCaldaGrams > 0 ? (totalCost / (totalCaldaGrams / 1000)) : 0;
  const finalCostKg = finalWeightGrams > 0 ? (totalBatchCost / (finalWeightGrams / 1000)) : caldaCostKg;
  const scoopCost60g = finalCostKg * 0.06;

  // Tub 500g Suggested Price
  // ((CustoFinal/Kg * 0.5 + Embalagem) + RateioIndireto) / ((1 - Margem/100) * (1 - TaxaCartao/100))
  const tubProductCost = finalCostKg * (pricing.tubWeightGrams / 1000);
  const directCostWithPack = tubProductCost + pricing.tubPackagingCost;
  const totalCostWithOverhead = directCostWithPack + pricing.indirectOverheadPerTub;
  const totalSalesDeductions = (pricing.cardFeePercent + (pricing.salesTaxPercent || 0)) / 100;
  const targetMarginDecimal = (pricing.targetProfitMarginPercent || 0) / 100;
  const totalDeductionsAndMargin = targetMarginDecimal + totalSalesDeductions;
  const marginDivisor = 1 - totalDeductionsAndMargin;
  const suggestedPrice500g =
    marginDivisor > 0 && totalDeductionsAndMargin < 1
      ? totalCostWithOverhead / marginDivisor
      : 0;
  const variegatoRatioPercent = finalWeightGrams > 0 ? (totalVariegatoGrams / finalWeightGrams) * 100 : 0;

  return {
    caldaWeight: totalCaldaGrams,
    batchScaleRatio: scale,
    totals: {
      sugars: totalSugars,
      fat: totalFat,
      msnf: totalMsnf,
      otherSolids: totalOtherSolids,
      totalSolids: totalSolids,
      water: totalWater,
      pod: totalPod,
      pac: totalPac,
      protein: totalProtein,
      cost: totalCost
    },
    percentages: {
      sugars: pctSugars,
      fat: pctFat,
      msnf: pctMsnf,
      otherSolids: pctOtherSolids,
      totalSolids: pctTotalSolids,
      water: pctWater,
      pod: relPod,
      pac: relPac,
      protein: pctProtein
    },
    validations,
    isBalanced,
    servingTemperature: Math.round(servingTemperature * 10) / 10,
    sandinessRisk,
    corvittoMetrics,
    allergensLabel,
    costing: {
      caldaCostKg: Math.round(caldaCostKg * 100) / 100,
      totalBatchCost: Math.round(totalBatchCost * 100) / 100,
      finalWeightGrams,
      finalCostKg: Math.round(finalCostKg * 100) / 100,
      scoopCost60g: Math.round(scoopCost60g * 100) / 100,
      suggestedPrice500g: Math.round(suggestedPrice500g * 100) / 100,
      variegatoRatioPercent: Math.round(variegatoRatioPercent * 10) / 10
    }
  };
}

