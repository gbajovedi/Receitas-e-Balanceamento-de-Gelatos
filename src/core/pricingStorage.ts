import { PricingSettings } from '../types/gelato';

export const STORAGE_KEY = 'gelato_pricing_params_v1';
export const PRICING_UPDATED_EVENT = 'gelato-pricing-updated';

export interface PricingParams {
  rent: number;
  electricity: number;
  water: number;
  payroll: number;
  accounting: number;
  software: number;
  secPackaging: number;
  marketing: number;
  telecom: number;
  fixedTaxes: number;
  posRentalMonthly: number; // Aluguel da maquininha (R$/mês)
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
  rent: 0,
  electricity: 100,
  water: 150,
  payroll: 2000,
  accounting: 350,
  software: 100,
  secPackaging: 200,
  marketing: 500,
  telecom: 120,
  fixedTaxes: 75,
  posRentalMonthly: 0,
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
  const totalFixedCosts =
    params.rent +
    params.electricity +
    params.water +
    params.payroll +
    params.accounting +
    params.software +
    params.secPackaging +
    params.marketing +
    params.telecom +
    params.fixedTaxes +
    (params.posRentalMonthly || 0);

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
