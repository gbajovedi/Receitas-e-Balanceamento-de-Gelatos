export interface Ingredient {
  id: string;
  name: string;
  category: string;
  costKg: number;
  packagePrice?: number;
  packageWeight?: number;
  packageUnit?: 'kg' | 'g';
  sugars: number;      // 0 to 1
  fat: number;         // 0 to 1
  msnf: number;        // SNGL (0 to 1)
  otherSolids: number; // OS (0 to 1)
  totalSolids: number; // ST (0 to 1)
  water: number;       // Água (0 to 1)
  pod: number;
  pac: number;
  protein: number;
  hasAllergen: boolean;
  isCustom?: boolean;
}

export interface NutrientValues {
  sugars: number;
  fat: number;
  msnf: number;
  otherSolids: number;
  totalSolids: number;
  water: number;
  pod: number;
  pac: number;
  protein: number;
}

export interface StyleStandard {
  name: string;
  pacDivisor: number;
  min: NutrientValues;
  max: NutrientValues;
}

export interface RecipeItem {
  name: string;
  grams: number;
}

export interface VariegatoItem {
  name: string;
  grams: number;
  costKg?: number;
}

export interface Recipe {
  id: string;
  name: string;
  category: string;
  targetStyle: string;
  ingredients: RecipeItem[];
  variegatos?: VariegatoItem[];
  totalGrams: number;
  isCustom?: boolean;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Preparation {
  name: string;
  category: 'Pré-preparo' | 'Variegato';
  instructions: string;
  ingredients: { name: string; grams: number }[];
}

export interface NutrientValidation {
  val: number;
  min: number;
  max: number;
  status: 'Ok' | 'Baixo' | 'Alto';
}

export interface BatchAnalysis {
  caldaWeight: number;
  batchScaleRatio: number;
  totals: {
    sugars: number;
    fat: number;
    msnf: number;
    otherSolids: number;
    totalSolids: number;
    water: number;
    pod: number;
    pac: number;
    protein: number;
    cost: number;
  };
  percentages: {
    sugars: number;
    fat: number;
    msnf: number;
    otherSolids: number;
    totalSolids: number;
    water: number;
    pod: number;
    pac: number;
    protein: number;
  };
  validations: {
    sugars: NutrientValidation;
    fat: NutrientValidation;
    msnf: NutrientValidation;
    otherSolids: NutrientValidation;
    totalSolids: NutrientValidation;
    water: NutrientValidation;
    pod: NutrientValidation;
    pac: NutrientValidation;
    protein: NutrientValidation;
  };
  isBalanced: boolean;
  servingTemperature: number;
  allergensLabel: string;
  costing: {
    caldaCostKg: number;
    totalBatchCost: number;
    finalWeightGrams: number;
    finalCostKg: number;
    scoopCost60g: number;
    suggestedPrice500g: number;
    variegatoRatioPercent: number;
  };
}

export interface PricingSettings {
  tubWeightGrams: number;
  tubPackagingCost: number;
  indirectOverheadPerTub: number;
  targetProfitMarginPercent: number;
  cardFeePercent: number;
  salesTaxPercent?: number;
}
