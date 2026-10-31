import React, { useState, useMemo, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  Percent,
  Sliders,
  Sparkles,
  Layers,
  ArrowRight,
  Check,
  AlertTriangle,
  Flame,
  PieChart,
  Save,
  RotateCcw,
  Wind,
  Package,
  Plus,
  Minus
} from 'lucide-react';
import { PricingParams, saveStoredPricingParams } from '../../core/pricingStorage';
import { PricingSettings } from '../../types/gelato';

export interface DensityAndVolumeMetrics {
  caldaDensity: number;
  baseLiquidVolumeLiters: number;
  baseVolumeLiters: number;
  variegatoVolumeLiters: number;
  totalVolumeLiters: number;
  baseOverrunPct: number;
  effectiveOverrunPct: number;
}

interface ProfitSimulatorProps {
  finalCostKg: number;
  batchWeightGrams: number;
  caldaWeightGrams?: number;
  totalVariegatoGrams?: number;
  densityAndVolume?: DensityAndVolumeMetrics;
  pricingParams: PricingParams;
  pricingSettings: PricingSettings;
  onMarginSaved?: (newMargin: number) => void;
}

export type SalesFormat = 'tub500' | 'tub1000' | 'cup120' | 'cup180' | 'cuba5L' | 'custom';
export type FormatMeasureType = 'volume' | 'weight';

interface FormatConfig {
  id: SalesFormat;
  name: string;
  title: string;
  subtitle: string;
  icon: string;
  type: FormatMeasureType;
  capacityMl?: number;
  weightGrams?: number;
  packagingCost: number;
  defaultPricePlaceholder: number;
}

const FORMAT_CONFIGS: Record<SalesFormat, FormatConfig> = {
  tub500: {
    id: 'tub500',
    name: 'Pote 500ml',
    title: 'Pote 500ml',
    subtitle: '500 ml',
    icon: '🍨',
    type: 'volume',
    capacityMl: 500,
    packagingCost: 2.50,
    defaultPricePlaceholder: 38.00
  },
  tub1000: {
    id: 'tub1000',
    name: 'Pote 1 Litro',
    title: 'Pote 1 Litro',
    subtitle: '1000 ml',
    icon: '🏺',
    type: 'volume',
    capacityMl: 1000,
    packagingCost: 3.80,
    defaultPricePlaceholder: 70.00
  },
  cup120: {
    id: 'cup120',
    name: 'Copinho 120ml (1 Bola)',
    title: 'Copinho 120ml',
    subtitle: '1 Bola • 120 ml',
    icon: '🍦',
    type: 'volume',
    capacityMl: 120,
    packagingCost: 0.60,
    defaultPricePlaceholder: 15.00
  },
  cup180: {
    id: 'cup180',
    name: 'Copinho 180ml (2 Bolas)',
    title: 'Copinho 180ml',
    subtitle: '2 Bolas • 180 ml',
    icon: '🍧',
    type: 'volume',
    capacityMl: 180,
    packagingCost: 0.85,
    defaultPricePlaceholder: 22.00
  },
  cuba5L: {
    id: 'cuba5L',
    name: 'Cuba GN 5L',
    title: 'Cuba GN 5L',
    subtitle: '5000 ml',
    icon: '📦',
    type: 'volume',
    capacityMl: 5000,
    packagingCost: 5.00,
    defaultPricePlaceholder: 240.00
  },
  custom: {
    id: 'custom',
    name: 'Personalizado',
    title: 'Personalizado',
    subtitle: 'Configurável',
    icon: '⚖️',
    type: 'volume',
    packagingCost: 1.00,
    defaultPricePlaceholder: 20.00
  }
};

export const ProfitSimulator: React.FC<ProfitSimulatorProps> = ({
  finalCostKg,
  batchWeightGrams,
  caldaWeightGrams,
  totalVariegatoGrams = 0,
  densityAndVolume,
  pricingParams,
  pricingSettings,
  onMarginSaved
}) => {
  // Mode: 'margin' (adjust target margin %) or 'price' (input market target price R$)
  const [mode, setMode] = useState<'margin' | 'price'>('margin');
  const [selectedFormat, setSelectedFormat] = useState<SalesFormat>('tub500');

  // Interactive Target Margin state (initialized from global settings)
  const [simulatedMargin, setSimulatedMargin] = useState<number>(pricingParams.targetMargin || 50);

  // Interactive Target Price state (for reverse simulation)
  const [simulatedPriceInput, setSimulatedPriceInput] = useState<string>('38.00');

  // Feedback state for saved margin
  const [isSaved, setIsSaved] = useState<boolean>(false);

  // Interactive Overrun Override state
  const initialBaseOverrun = densityAndVolume?.baseOverrunPct ?? 35;
  const [userOverrun, setUserOverrun] = useState<number>(initialBaseOverrun);

  // Update overrun if recipe changes externally and user hasn't actively changed it
  useEffect(() => {
    if (densityAndVolume?.baseOverrunPct) {
      setUserOverrun(densityAndVolume.baseOverrunPct);
    }
  }, [densityAndVolume?.baseOverrunPct]);

  // Custom Format state
  const [customMeasureType, setCustomMeasureType] = useState<FormatMeasureType>('volume');
  const [customVolumeInput, setCustomVolumeInput] = useState<number>(250);
  const [customWeightInput, setCustomWeightInput] = useState<number>(100);
  const [customPackCostInput, setCustomPackCostInput] = useState<number>(1.00);

  // Physical calculations based on Calda, Overrun and Variegatos
  const actualCaldaWeight = caldaWeightGrams || Math.max(0, batchWeightGrams - totalVariegatoGrams);
  const caldaDensity = densityAndVolume?.caldaDensity || 1.10;
  const VARIEGATO_DENSITY = 1.30;

  // Volumes
  const baseLiquidVolLiters = caldaDensity > 0 ? (actualCaldaWeight / 1000) / caldaDensity : 0;
  const baseAeratedVolLiters = baseLiquidVolLiters * (1 + (userOverrun / 100));
  const variegatoVolLiters = totalVariegatoGrams > 0 ? (totalVariegatoGrams / 1000) / VARIEGATO_DENSITY : 0;
  const totalBatchVolLiters = baseAeratedVolLiters + variegatoVolLiters;
  const totalBatchVolMl = totalBatchVolLiters * 1000;

  // Effective overrun of entire batch including compact variegatos
  const totalLiquidVolLiters = baseLiquidVolLiters + variegatoVolLiters;
  const effectiveBatchOverrun =
    totalLiquidVolLiters > 0
      ? ((totalBatchVolLiters - totalLiquidVolLiters) / totalLiquidVolLiters) * 100
      : userOverrun;

  // Selected format configuration
  const activeFormat = FORMAT_CONFIGS[selectedFormat];
  const formatPackCost =
    selectedFormat === 'tub500'
      ? pricingParams.tubPackCost
      : selectedFormat === 'custom'
      ? customPackCostInput
      : activeFormat.packagingCost;

  // Determine active unit weight and batch yield depending on volume vs weight format
  let unitsInBatch = 0;
  let formatWeightGrams = 0;
  let formatCapacityDisplay = '';

  if (selectedFormat === 'custom') {
    if (customMeasureType === 'volume') {
      const vol = Math.max(1, customVolumeInput);
      formatCapacityDisplay = `${vol} ml`;
      unitsInBatch = vol > 0 ? (totalBatchVolMl / vol) : 0;
      formatWeightGrams = unitsInBatch > 0 ? (batchWeightGrams / unitsInBatch) : 0;
    } else {
      const w = Math.max(1, customWeightInput);
      formatCapacityDisplay = `${w} g`;
      formatWeightGrams = w;
      unitsInBatch = w > 0 ? (batchWeightGrams / w) : 0;
    }
  } else if (activeFormat.type === 'volume' && activeFormat.capacityMl) {
    const vol = activeFormat.capacityMl;
    formatCapacityDisplay = `${vol} ml`;
    unitsInBatch = vol > 0 ? (totalBatchVolMl / vol) : 0;
    formatWeightGrams = unitsInBatch > 0 ? (batchWeightGrams / unitsInBatch) : 0;
  } else {
    const w = activeFormat.weightGrams || 100;
    formatCapacityDisplay = `${w} g`;
    formatWeightGrams = w;
    unitsInBatch = w > 0 ? (batchWeightGrams / w) : 0;
  }

  // Overhead rateio proporcional à gramagem baseada no pote de 500g
  const weightRatio = formatWeightGrams / (pricingParams.tubWeightGrams || 500);
  const overheadPerUnit = pricingSettings.indirectOverheadPerTub * weightRatio;

  // Deductions from sales (card fee + sales tax)
  const salesDeductionsRate =
    (pricingSettings.cardFeePercent + (pricingParams.salesTaxPercent || 0)) / 100;

  // Product Direct Cost (calculated with real physical weight in the package)
  const productCost = finalCostKg * (formatWeightGrams / 1000);
  const directCostWithPack = productCost + formatPackCost;
  const totalCostUnit = directCostWithPack + overheadPerUnit;

  // Direct Calculation: Price from Simulated Margin (Official Sebrae Markup Divisor)
  const totalMarginAndDeductions = (simulatedMargin / 100) + salesDeductionsRate;
  const marginDivisor = Math.max(0.001, 1 - totalMarginAndDeductions);
  const calculatedPrice = totalMarginAndDeductions < 1 ? totalCostUnit / marginDivisor : 0;

  // Reverse Calculation: Margin from Simulated Price (Lucro Líquido / Preço de Venda)
  const manualPrice = parseFloat(simulatedPriceInput) || 0;
  const netRevenueFromManual = manualPrice * (1 - salesDeductionsRate);
  const calculatedMarginFromPrice =
    manualPrice > 0
      ? Math.max(-100, Math.min(95, ((netRevenueFromManual - totalCostUnit) / manualPrice) * 100))
      : 0;

  // Current Active Metrics based on current mode
  const effectivePrice = mode === 'margin' ? calculatedPrice : manualPrice;
  const effectiveMargin = mode === 'margin' ? simulatedMargin : calculatedMarginFromPrice;

  // Net Profit in R$ per unit
  const totalDeductionsR$ = effectivePrice * salesDeductionsRate;
  const netRevenue = effectivePrice - totalDeductionsR$;
  const netProfitUnit = netRevenue - totalCostUnit;

  // Total Batch Financials
  const totalBatchGrossRevenue = unitsInBatch * effectivePrice;
  const totalBatchNetProfit = unitsInBatch * netProfitUnit;

  // Breakdown of yield (e.g. 7 full tubs + 1 partial)
  const fullUnits = Math.floor(unitsInBatch);
  const remainderUnitPct = Math.round((unitsInBatch - fullUnits) * 100);

  // Sync manual input placeholder when format changes
  useEffect(() => {
    if (mode === 'price') {
      const defaultP = FORMAT_CONFIGS[selectedFormat].defaultPricePlaceholder;
      setSimulatedPriceInput(defaultP.toFixed(2));
    }
  }, [selectedFormat, mode]);

  // Handle saving current margin as global store default
  const handleSaveAsGlobalDefault = () => {
    const newMargin = Math.round(effectiveMargin);
    if (newMargin <= 0 || newMargin >= 100) return;

    const updated: PricingParams = {
      ...pricingParams,
      targetMargin: newMargin
    };
    saveStoredPricingParams(updated);
    setIsSaved(true);
    if (onMarginSaved) onMarginSaved(newMargin);
    setTimeout(() => setIsSaved(false), 2500);
  };

  // Status diagnosis
  let marginHealth: { label: string; color: string; badge: string; icon: string } = {
    label: 'Margem Saudável & Equilibrada',
    color: 'text-emerald-400',
    badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
    icon: '✨'
  };

  if (effectiveMargin < 20) {
    marginHealth = {
      label: 'Alerta: Margem Crítica / Risco de Prejuízo',
      color: 'text-rose-400',
      badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      icon: '⚠️'
    };
  } else if (effectiveMargin < 40) {
    marginHealth = {
      label: 'Margem Baixa (Promocional / Alto Giro)',
      color: 'text-amber-400',
      badge: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
      icon: '⚡'
    };
  } else if (effectiveMargin >= 65) {
    marginHealth = {
      label: 'Super Lucratividade (Linha Premium)',
      color: 'text-yellow-300',
      badge: 'bg-yellow-500/20 text-yellow-200 border-yellow-500/40',
      icon: '💎'
    };
  }

  // Waterfall Percentages of Effective Price
  const pGelato = effectivePrice > 0 ? (productCost / effectivePrice) * 100 : 0;
  const pPack = effectivePrice > 0 ? (formatPackCost / effectivePrice) * 100 : 0;
  const pOverhead = effectivePrice > 0 ? (overheadPerUnit / effectivePrice) * 100 : 0;
  const pTaxes = effectivePrice > 0 ? (totalDeductionsR$ / effectivePrice) * 100 : 0;
  const pProfit = effectivePrice > 0 ? (netProfitUnit / effectivePrice) * 100 : 0;

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-slate-900/95 via-slate-900 to-slate-950 border border-slate-700/80 shadow-2xl space-y-5">
      {/* 1. Header do Simulador Executivo com Alternância e Overrun Integrados */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-700/80">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
              <DollarSign className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <span>Simulador de Lucro & Rendimento por Volume</span>
              </h3>
              <p className="text-xs text-slate-400">
                Calcule preço de venda, margem líquida e rendimento exato de potes com base na aeração real.
              </p>
            </div>
          </div>
        </div>

        {/* Controles de Aeração & Alternância de Modo */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          {/* Calibrador de Overrun */}
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-purple-500/30 shadow-inner">
            <div className="flex items-center gap-1.5 text-purple-300">
              <Wind className="w-4 h-4 text-purple-400 shrink-0" />
              <span className="text-xs font-bold whitespace-nowrap">Overrun:</span>
            </div>

            <div className="flex items-center gap-1 bg-slate-900 border border-slate-700/80 rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => setUserOverrun(prev => Math.max(10, prev - 2))}
                className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-all active:scale-95"
                title="Diminuir aeração em 2%"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="text-xs font-mono font-black text-white px-1 min-w-[34px] text-center">
                {userOverrun}%
              </span>
              <button
                type="button"
                onClick={() => setUserOverrun(prev => Math.min(70, prev + 2))}
                className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-all active:scale-95"
                title="Aumentar aeração em 2%"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>

            {densityAndVolume?.baseOverrunPct && userOverrun !== densityAndVolume.baseOverrunPct && (
              <button
                type="button"
                onClick={() => setUserOverrun(densityAndVolume.baseOverrunPct)}
                className="text-[11px] text-purple-400 hover:text-purple-300 underline flex items-center gap-0.5 ml-1"
                title="Restaurar estimativa bromatológica"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span>Reset ({densityAndVolume.baseOverrunPct}%)</span>
              </button>
            )}
          </div>

          {/* Mode Switch (Margem vs Preço) */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setMode('margin')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                mode === 'margin'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Por Margem %</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('price')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                mode === 'price'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Percent className="w-3.5 h-3.5" />
              <span>Preço Fixo R$</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Seleção de Formatos de Venda (Grade Ampla de 6 Colunas) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Package className="w-4 h-4 text-amber-400" />
            <span>Formato de Envase e Venda:</span>
          </span>
          <span className="text-xs text-purple-300 font-medium font-mono">
            Volume Total do Lote: <strong className="text-white">{totalBatchVolLiters.toFixed(2)} L</strong> ({Math.round(batchWeightGrams)}g)
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {(Object.keys(FORMAT_CONFIGS) as SalesFormat[]).map(fmt => {
            const config = FORMAT_CONFIGS[fmt];
            const isSelected = selectedFormat === fmt;
            const subtitleText =
              fmt === 'custom'
                ? customMeasureType === 'volume' ? `${customVolumeInput}ml` : `${customWeightInput}g`
                : config.subtitle;

            return (
              <button
                key={fmt}
                type="button"
                onClick={() => setSelectedFormat(fmt)}
                className={`py-3 px-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 relative ${
                  isSelected
                    ? 'bg-amber-500/20 border-amber-500/70 text-amber-200 shadow-md ring-1 ring-amber-500/40'
                    : 'bg-slate-900/80 border-slate-700/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <span className="text-xl select-none leading-none mb-0.5">{config.icon}</span>
                <span className="text-xs font-bold leading-tight truncate max-w-full">
                  {config.title}
                </span>
                <span
                  className={`text-xs font-mono font-medium leading-tight ${
                    isSelected ? 'text-amber-300 font-bold' : 'text-slate-400'
                  }`}
                >
                  {subtitleText}
                </span>
              </button>
            );
          })}
        </div>

        {/* Custom Configuration Box if 'custom' is active */}
        {selectedFormat === 'custom' && (
          <div className="bg-slate-900/90 border border-amber-500/40 rounded-xl p-3.5 space-y-3 animate-in fade-in duration-150 shadow-inner">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800 text-xs">
              <span className="text-slate-300 font-bold">Unidade de Medida Personalizada:</span>
              <button
                type="button"
                onClick={() => setCustomMeasureType('volume')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  customMeasureType === 'volume'
                    ? 'bg-purple-500/25 text-purple-200 border border-purple-500/50 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Volume (ml)
              </button>
              <button
                type="button"
                onClick={() => setCustomMeasureType('weight')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  customMeasureType === 'weight'
                    ? 'bg-amber-500/25 text-amber-200 border border-amber-500/50 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Massa (g)
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
              <div>
                <label className="text-xs font-bold text-amber-300 uppercase tracking-wider block mb-1">
                  {customMeasureType === 'volume' ? '📐 Capacidade da Embalagem' : '⚖️ Peso da Porção'}
                </label>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    min="1"
                    max="10000"
                    step={customMeasureType === 'volume' ? '10' : '5'}
                    value={customMeasureType === 'volume' ? (customVolumeInput || '') : (customWeightInput || '')}
                    onChange={e => {
                      const val = Math.max(1, parseFloat(e.target.value) || 0);
                      if (customMeasureType === 'volume') {
                        setCustomVolumeInput(val);
                      } else {
                        setCustomWeightInput(val);
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-lg pl-3 pr-10 py-2 text-sm font-mono font-bold text-amber-300 focus:outline-none"
                    placeholder={customMeasureType === 'volume' ? '250' : '150'}
                  />
                  <span className="absolute right-3 text-xs text-slate-400 font-bold pointer-events-none">
                    {customMeasureType === 'volume' ? 'ml' : 'g'}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                  📦 Custo Unitário da Embalagem
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-xs text-slate-400 font-bold pointer-events-none">
                    R$
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.10"
                    value={customPackCostInput === 0 ? '' : customPackCostInput}
                    onChange={e => setCustomPackCostInput(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-lg pl-9 pr-3 py-2 text-sm font-mono font-bold text-white focus:outline-none"
                    placeholder="1.00"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Cockpit Executivo em 3 Colunas Espaçosas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* COLUNA 1: Controles de Margem/Preço e DRE do Pote (5 Colunas) */}
        <div className="lg:col-span-5 space-y-4">
          {mode === 'margin' ? (
            <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-amber-400" />
                  <span>Margem de Lucro Alvo:</span>
                </span>
                <span className="text-2xl font-black font-mono text-amber-400 tracking-tight">
                  {simulatedMargin}%
                </span>
              </div>

              {/* Slider Contínuo */}
              <input
                type="range"
                min="15"
                max="80"
                step="1"
                value={simulatedMargin}
                onChange={e => setSimulatedMargin(parseInt(e.target.value) || 50)}
                className="w-full accent-amber-500 bg-slate-800 h-2 rounded-lg cursor-pointer transition-all"
              />

              {/* Atalhos Rápidos de Margem */}
              <div className="flex items-center justify-between gap-1.5 pt-1">
                {[35, 50, 60, 70].map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setSimulatedMargin(m)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border ${
                      simulatedMargin === m
                        ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-sm'
                        : 'bg-slate-900 border-slate-700/80 text-slate-300 hover:text-white hover:border-slate-600'
                    }`}
                  >
                    {m}%
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Percent className="w-4 h-4 text-emerald-400" />
                  <span>Preço de Venda Praticado (R$):</span>
                </span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full border font-bold ${marginHealth.badge}`}>
                  {effectiveMargin.toFixed(1)}% Margem
                </span>
              </div>

              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-400 font-mono font-bold text-base">
                  R$
                </span>
                <input
                  type="number"
                  min="1"
                  step="0.5"
                  value={simulatedPriceInput}
                  onChange={e => setSimulatedPriceInput(e.target.value)}
                  placeholder="38.00"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-11 pr-4 py-2.5 text-2xl font-mono font-black text-white focus:outline-none focus:border-emerald-500 shadow-inner"
                />
              </div>
              <span className="text-xs text-slate-400 block">
                Digite o valor da sua etiqueta na loja para conferir a margem líquida real.
              </span>
            </div>
          )}

          {/* DRE Visual do Recipiente: Waterfall Bar */}
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <PieChart className="w-3.5 h-3.5 text-cyan-400" />
                Decomposição de Cada Real Cobrado
              </span>
              <span className="text-xs font-mono text-slate-400">100% Preço</span>
            </div>

            {/* Barra Colorida Empilhada */}
            <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden flex shadow-inner border border-slate-800">
              <div
                className="h-full bg-sky-400"
                style={{ width: `${Math.max(0, pGelato)}%` }}
                title={`Gelato (Insumos): R$ ${productCost.toFixed(2)} (${pGelato.toFixed(1)}%)`}
              />
              <div
                className="h-full bg-amber-400"
                style={{ width: `${Math.max(0, pPack)}%` }}
                title={`Embalagem: R$ ${formatPackCost.toFixed(2)} (${pPack.toFixed(1)}%)`}
              />
              <div
                className="h-full bg-purple-400"
                style={{ width: `${Math.max(0, pOverhead)}%` }}
                title={`Rateio Fixo: R$ ${overheadPerUnit.toFixed(2)} (${pOverhead.toFixed(1)}%)`}
              />
              <div
                className="h-full bg-rose-400"
                style={{ width: `${Math.max(0, pTaxes)}%` }}
                title={`Taxas & Impostos: R$ ${totalDeductionsR$.toFixed(2)} (${pTaxes.toFixed(1)}%)`}
              />
              <div
                className="h-full bg-emerald-400"
                style={{ width: `${Math.max(0, pProfit)}%` }}
                title={`Lucro Líquido: R$ ${netProfitUnit.toFixed(2)} (${pProfit.toFixed(1)}%)`}
              />
            </div>

            {/* Legenda DRE */}
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-slate-300 pt-0.5">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400 shrink-0" />
                <span className="text-slate-400">Insumos ({Math.round(formatWeightGrams)}g):</span>
                <strong className="text-white font-mono">R$ {productCost.toFixed(2)}</strong>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
                <span className="text-slate-400">Embalagem:</span>
                <strong className="text-white font-mono">R$ {formatPackCost.toFixed(2)}</strong>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-400 shrink-0" />
                <span className="text-slate-400">Rateio Fixo:</span>
                <strong className="text-white font-mono">R$ {overheadPerUnit.toFixed(2)}</strong>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400 shrink-0" />
                <span className="text-slate-400">Taxas & Imp:</span>
                <strong className="text-white font-mono">R$ {totalDeductionsR$.toFixed(2)}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* COLUNA 2: Preço & Lucro Unitário em Destaque (3 Colunas) */}
        <div className="lg:col-span-3 flex flex-col justify-between p-4 rounded-xl bg-gradient-to-br from-emerald-950/70 to-slate-900 border border-emerald-600/40 shadow-md space-y-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 block">
              Preço Sugerido de Venda
            </span>
            <div className="text-3xl sm:text-4xl font-black text-emerald-400 font-mono tracking-tight mt-1">
              R$ {effectivePrice.toFixed(2)}
            </div>
            <span className="text-xs text-slate-300 font-mono block mt-0.5">
              por {selectedFormat === 'custom' ? `unidade (${formatCapacityDisplay})` : activeFormat.name.toLowerCase()}
            </span>
          </div>

          <div className="pt-3 border-t border-emerald-900/60">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 block">
              Lucro Líquido Unitário
            </span>
            <div className={`text-2xl sm:text-3xl font-black font-mono tracking-tight mt-1 ${netProfitUnit >= 0 ? 'text-emerald-300' : 'text-rose-400'}`}>
              R$ {netProfitUnit.toFixed(2)}
            </div>
            <span className={`text-xs font-bold font-mono block mt-0.5 ${effectiveMargin >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              ({effectiveMargin.toFixed(1)}% margem líquida)
            </span>
          </div>

          {/* Diagnóstico & Salvar Padrão */}
          <div className="pt-3 border-t border-emerald-900/60 flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span>{marginHealth.icon}</span>
              <strong className={marginHealth.color}>{marginHealth.label}</strong>
            </span>

            {mode === 'margin' && Math.round(effectiveMargin) !== pricingParams.targetMargin && (
              <button
                type="button"
                onClick={handleSaveAsGlobalDefault}
                className="text-xs font-bold text-amber-300 hover:text-amber-200 underline flex items-center gap-1"
                title="Salvar esta margem como padrão para toda a loja"
              >
                {isSaved ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Salvo!
                  </span>
                ) : (
                  <span>Salvar Padrão</span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* COLUNA 3: Rendimento Físico & Finanças do Lote (4 Colunas) */}
        <div className="lg:col-span-4 flex flex-col justify-between p-4 rounded-xl bg-slate-900/95 border border-slate-700/80 shadow-md space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Rendimento Físico do Lote
              </span>
            </div>

            <span className="text-sm font-mono font-black text-amber-300">
              {unitsInBatch.toFixed(1)} un
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between bg-slate-950/70 p-2 rounded-lg border border-slate-800/80">
              <span className="text-slate-400">Embalagens Preenchidas:</span>
              <strong className="text-white font-mono font-bold">
                {fullUnits} cheias {remainderUnitPct > 0 ? `+ 1 (${remainderUnitPct}%)` : ''}
              </strong>
            </div>

            <div className="flex items-center justify-between bg-slate-950/70 p-2 rounded-lg border border-slate-800/80">
              <span className="text-slate-400">Peso Real de Gelato no Pote:</span>
              <strong className="text-amber-300 font-mono font-bold text-sm">
                {Math.round(formatWeightGrams)} g
              </strong>
            </div>

            {activeFormat.type === 'volume' && activeFormat.capacityMl && (
              <div className="flex items-center justify-between text-xs px-1 text-slate-400">
                <span>Economia por Aeração:</span>
                <span className="text-emerald-400 font-mono font-bold">
                  -{Math.max(0, Math.round(activeFormat.capacityMl - formatWeightGrams))}g de calda/pote
                </span>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Faturamento Bruto do Lote:</span>
              <strong className="text-white font-mono font-bold">
                R$ {totalBatchGrossRevenue.toFixed(2)}
              </strong>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Lucro Líquido no Bolso:</span>
              <strong className="text-emerald-400 font-mono font-black text-base">
                R$ {totalBatchNetProfit.toFixed(2)}
              </strong>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
              <span>Overrun Efetivo c/ Mescla:</span>
              <span className="text-purple-300 font-mono font-bold">
                ~{effectiveBatchOverrun.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
