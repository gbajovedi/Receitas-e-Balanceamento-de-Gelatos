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
  monthlyUnits: number;
  tubWeightGrams: number;
  tubPackCost: number;
  targetMargin: number;
  cardFee: number;
  salesTaxPercent: number;
  sampleCaldaCostKg: number;
}

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
  monthlyUnits: 4000,
  tubWeightGrams: 500,
  tubPackCost: 1.50,
  targetMargin: 40,
  cardFee: 3.5,
  salesTaxPercent: 0,
  sampleCaldaCostKg: 15.00
};

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
    params.fixedTaxes;

  const overheadPerUnit = params.monthlyUnits > 0 ? totalFixedCosts / params.monthlyUnits : 0;

  return {
    tubWeightGrams: params.tubWeightGrams,
    tubPackagingCost: params.tubPackCost,
    indirectOverheadPerTub: overheadPerUnit,
    targetProfitMarginPercent: params.targetMargin,
    cardFeePercent: params.cardFee,
    salesTaxPercent: params.salesTaxPercent
  };
}
