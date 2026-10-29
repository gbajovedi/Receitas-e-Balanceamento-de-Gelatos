import { PricingSettings } from '../types/gelato';

export const STORAGE_KEY = 'gelato_pricing_params_v1';
export const PRICING_UPDATED_EVENT = 'gelato-pricing-updated';

export interface PricingParams {
  // 1. Ocupação & Utilidades
  rent: number;
  electricity: number;
  water: number;
  telecom: number;

  // 2. Pessoal & Gestão
  payroll: number;
  ownerSalary: number; // Pró-labore do mestre gelatiere / sócios
  accounting: number;
  software: number;

  // 3. Refrigeração, Máquinas & Sanitização
  equipmentMaintenance: number; // Manutenção preventiva de refrigeração e compressores
  equipmentDepreciation: number; // Depreciação / Fundo de reposição de maquinário
  cleaningHygiene: number; // Higiene industrial, sanitizantes CIP e químicos
  secPackaging: number; // Embalagens secundárias (guardanapos, sacolas, colheres)

  // 4. Tributos, Licenças, Marketing & Vendas
  fixedTaxes: number; // Impostos fixos / MEI (DAS)
  licensesAndPermits: number; // Alvarás, RT nutricionista, bombeiros, laudos e dedetização
  commercialInsurance: number; // Seguros patrimoniais e perda de estoque refrigerado
  posRentalMonthly: number; // Aluguel da maquininha (R$/mês)
  marketing: number; // Marketing e redes sociais

  // Produção e Pote
  monthlyUnits: number;
  tubWeightGrams: number;
  tubPackCost: number;
  targetMargin: number;

  // Taxa de Cartão manual (fallback)
  cardFee: number;

  // Maquininha Cielo / Adquirentes detalhadas
  useSalesMix: boolean;
  cieloPlan: 'padrao' | 'negociado' | 'fluxo' | 'custom';
  cardFeePix: number;
  cardFeeDebit: number;
  cardFeeCreditSight: number;
  cardFeeCreditInstallment: number;

  // Mix de Vendas (% do balcão)
  mixPix: number;
  mixDebit: number;
  mixCreditSight: number;
  mixCreditInstallment: number;

  salesTaxPercent: number;
  sampleCaldaCostKg: number;
}

export const CIELO_PRESETS = {
  padrao: {
    name: 'Cielo Padrão D+1 (Sem Aluguel)',
    description: 'Plano padrão com recebimento no dia útil seguinte para faturamentos até R$ 15 mil.',
    posRentalMonthly: 0,
    cardFeePix: 0.00,
    cardFeeDebit: 1.49,
    cardFeeCreditSight: 4.30,
    cardFeeCreditInstallment: 9.90
  },
  negociado: {
    name: 'Cielo Negociado (> R$ 15k / Aluguel Isento)',
    description: 'Taxas reduzidas para estabelecimentos com faturamento maior negociado.',
    posRentalMonthly: 0,
    cardFeePix: 0.00,
    cardFeeDebit: 1.19,
    cardFeeCreditSight: 3.19,
    cardFeeCreditInstallment: 6.90
  },
  fluxo: {
    name: 'Cielo no Fluxo (D+30 tradicional)',
    description: 'Sem antecipação: recebe o crédito em 30 dias e parcelas a cada mês.',
    posRentalMonthly: 0,
    cardFeePix: 0.00,
    cardFeeDebit: 1.49,
    cardFeeCreditSight: 2.79,
    cardFeeCreditInstallment: 5.49
  }
} as const;

export const DEFAULT_PRICING_PARAMS: PricingParams = {
  // 1. Ocupação & Utilidades
  rent: 0,
  electricity: 100,
  water: 150,
  telecom: 120,

  // 2. Pessoal & Gestão
  payroll: 2000,
  ownerSalary: 0,
  accounting: 350,
  software: 100,

  // 3. Refrigeração, Máquinas & Sanitização
  equipmentMaintenance: 250,
  equipmentDepreciation: 350,
  cleaningHygiene: 150,
  secPackaging: 200,

  // 4. Tributos, Licenças, Marketing & Vendas
  fixedTaxes: 75,
  licensesAndPermits: 100,
  commercialInsurance: 0,
  posRentalMonthly: 0,
  marketing: 500,

  monthlyUnits: 4000,
  tubWeightGrams: 500,
  tubPackCost: 1.50,
  targetMargin: 40,
  cardFee: 2.03,
  useSalesMix: true,
  cieloPlan: 'padrao',
  // Auto-preenchimento oficial Cielo:
  cardFeePix: 0.00,
  cardFeeDebit: 1.49,
  cardFeeCreditSight: 4.30,
  cardFeeCreditInstallment: 9.90,
  // Mix de vendas padrão de uma gelateria brasileira:
  mixPix: 30,
  mixDebit: 45,
  mixCreditSight: 20,
  mixCreditInstallment: 5,
  salesTaxPercent: 0,
  sampleCaldaCostKg: 15.00
};

export function calculateTotalFixedCosts(params: PricingParams): number {
  return (
    (params.rent || 0) +
    (params.electricity || 0) +
    (params.water || 0) +
    (params.telecom || 0) +
    (params.payroll || 0) +
    (params.ownerSalary || 0) +
    (params.accounting || 0) +
    (params.software || 0) +
    (params.equipmentMaintenance || 0) +
    (params.equipmentDepreciation || 0) +
    (params.cleaningHygiene || 0) +
    (params.secPackaging || 0) +
    (params.fixedTaxes || 0) +
    (params.licensesAndPermits || 0) +
    (params.commercialInsurance || 0) +
    (params.posRentalMonthly || 0) +
    (params.marketing || 0)
  );
}

export function calculateEffectiveCardFee(params: PricingParams): number {
  if (!params.useSalesMix) {
    return params.cardFee;
  }
  const totalMix = params.mixPix + params.mixDebit + params.mixCreditSight + params.mixCreditInstallment;
  if (totalMix <= 0) return params.cardFee;

  const weightedSum =
    params.cardFeePix * params.mixPix +
    params.cardFeeDebit * params.mixDebit +
    params.cardFeeCreditSight * params.mixCreditSight +
    params.cardFeeCreditInstallment * params.mixCreditInstallment;

  return Math.round((weightedSum / totalMix) * 100) / 100;
}

export function getStoredPricingParams(): PricingParams {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_PRICING_PARAMS, ...parsed };
    }
  } catch (err) {
    console.warn('Erro ao carregar parâmetros de precificação do localStorage:', err);
  }
  return DEFAULT_PRICING_PARAMS;
}

export function saveStoredPricingParams(params: PricingParams): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(params));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event(PRICING_UPDATED_EVENT));
    }
  } catch (err) {
    console.warn('Erro ao salvar parâmetros de precificação no localStorage:', err);
  }
}

export function getPricingSettings(params: PricingParams = getStoredPricingParams()): PricingSettings {
  const totalFixedCosts = calculateTotalFixedCosts(params);
  const overheadPerUnit = params.monthlyUnits > 0 ? totalFixedCosts / params.monthlyUnits : 0;
  const effectiveCardFee = calculateEffectiveCardFee(params);

  return {
    tubWeightGrams: params.tubWeightGrams,
    tubPackagingCost: params.tubPackCost,
    indirectOverheadPerTub: overheadPerUnit,
    targetProfitMarginPercent: params.targetMargin,
    cardFeePercent: effectiveCardFee,
    salesTaxPercent: params.salesTaxPercent
  };
}
