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
  RotateCcw
} from 'lucide-react';
import { PricingParams, saveStoredPricingParams } from '../../core/pricingStorage';
import { PricingSettings } from '../../types/gelato';

interface ProfitSimulatorProps {
  finalCostKg: number;
  batchWeightGrams: number;
  pricingParams: PricingParams;
  pricingSettings: PricingSettings;
  onMarginSaved?: (newMargin: number) => void;
}

export type SalesFormat = 'tub500' | 'scoop1' | 'scoop2' | 'cuba4k' | 'custom';

interface FormatConfig {
  id: SalesFormat;
  name: string;
  icon: string;
  weightGrams: number;
  packagingCost: number;
  defaultPricePlaceholder: number;
}

const FORMAT_CONFIGS: Record<SalesFormat, FormatConfig> = {
  tub500: {
    id: 'tub500',
    name: 'Pote 500g',
    icon: '🍨',
    weightGrams: 500,
    packagingCost: 2.50,
    defaultPricePlaceholder: 38.00
  },
  scoop1: {
    id: 'scoop1',
    name: '1 Bola (60g)',
    icon: '🍦',
    weightGrams: 60,
    packagingCost: 0.60,
    defaultPricePlaceholder: 15.00
  },
  scoop2: {
    id: 'scoop2',
    name: '2 Bolas (120g)',
    icon: '🍧',
    weightGrams: 120,
    packagingCost: 0.85,
    defaultPricePlaceholder: 22.00
  },
  cuba4k: {
    id: 'cuba4k',
    name: 'Cuba 4kg',
    icon: '📦',
    weightGrams: 4000,
    packagingCost: 5.00,
    defaultPricePlaceholder: 220.00
  },
  custom: {
    id: 'custom',
    name: 'Personalizado',
    icon: '⚖️',
    weightGrams: 100,
    packagingCost: 1.00,
    defaultPricePlaceholder: 20.00
  }
};

export const ProfitSimulator: React.FC<ProfitSimulatorProps> = ({
  finalCostKg,
  batchWeightGrams,
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

  // Custom Weight & Packaging state for 'custom' format
  const [customWeightInput, setCustomWeightInput] = useState<number>(100);
  const [customPackCostInput, setCustomPackCostInput] = useState<number>(1.00);

  // Sync format packaging cost from pricingParams if tub500 is selected
  const activeFormat = FORMAT_CONFIGS[selectedFormat];
  const formatPackCost =
    selectedFormat === 'tub500'
      ? pricingParams.tubPackCost
      : selectedFormat === 'custom'
      ? customPackCostInput
      : activeFormat.packagingCost;
  const formatWeightGrams =
    selectedFormat === 'tub500'
      ? pricingParams.tubWeightGrams
      : selectedFormat === 'custom'
      ? customWeightInput
      : activeFormat.weightGrams;

  // Overhead rateio proporcional à gramagem baseada no pote de 500g
  const weightRatio = formatWeightGrams / (pricingParams.tubWeightGrams || 500);
  const overheadPerUnit = pricingSettings.indirectOverheadPerTub * weightRatio;

  // Deductions from sales (card fee + sales tax)
  const salesDeductionsRate =
    (pricingSettings.cardFeePercent + (pricingParams.salesTaxPercent || 0)) / 100;
  const netRevenueFactor = Math.max(0.01, 1 - salesDeductionsRate);

  // Product Direct Cost
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

  // Yield from current batch
  const unitsInBatch = formatWeightGrams > 0 ? batchWeightGrams / formatWeightGrams : 0;
  const totalBatchGrossRevenue = unitsInBatch * effectivePrice;
  const totalBatchNetProfit = unitsInBatch * netProfitUnit;

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
      label: 'Alerta: Margem Crítica / Prejuízo Risco',
      color: 'text-rose-400',
      badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      icon: '⚠️'
    };
  } else if (effectiveMargin < 40) {
    marginHealth = {
      label: 'Margem Baixa (Promocional / Volume)',
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
    <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900/95 via-slate-900 to-slate-950 border border-slate-700/80 shadow-2xl space-y-4">
      {/* Header & Mode Switch */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-700/80">
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-emerald-400" />
          <h3 className="text-base font-black text-white flex items-center gap-1.5">
            <span>Simulador de Margem & Preço</span>
          </h3>
        </div>

        {/* Mode Toggle Pills */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setMode('margin')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
              mode === 'margin'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Por Margem %
          </button>
          <button
            type="button"
            onClick={() => setMode('price')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
              mode === 'price'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Preço Fixo R$
          </button>
        </div>
      </div>

      {/* Format Selector Tabs */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
          Formato de Venda no Balcão:
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
          {(Object.keys(FORMAT_CONFIGS) as SalesFormat[]).map(fmt => {
            const config = FORMAT_CONFIGS[fmt];
            const isSelected = selectedFormat === fmt;
            const displayName =
              fmt === 'custom' && customWeightInput > 0
                ? `Personalizado (${customWeightInput}g)`
                : config.name;

            return (
              <button
                key={fmt}
                type="button"
                onClick={() => setSelectedFormat(fmt)}
                className={`p-2 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 text-center ${
                  isSelected
                    ? 'bg-amber-500/15 border-amber-500/60 text-amber-200 shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <span className="text-base select-none">{config.icon}</span>
                <span className="leading-tight text-[11px]">{displayName}</span>
              </button>
            );
          })}
        </div>

        {/* Custom Weight & Packaging Inputs when 'custom' format is selected */}
        {selectedFormat === 'custom' && (
          <div className="bg-slate-900/90 border border-amber-500/40 rounded-xl p-3 flex flex-wrap items-center gap-3 animate-in fade-in duration-150 shadow-inner">
            <div className="flex-1 min-w-[130px]">
              <label className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block mb-1">
                ⚖️ Peso da Porção (g):
              </label>
              <div className="relative flex items-center">
                <input
                  type="number"
                  min="1"
                  max="10000"
                  step="1"
                  value={customWeightInput || ''}
                  onChange={e => setCustomWeightInput(Math.max(1, parseFloat(e.target.value) || 0))}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-lg pl-3 pr-10 py-1.5 text-xs font-mono font-bold text-amber-300 focus:outline-none"
                  placeholder="Ex: 80"
                />
                <span className="absolute right-2.5 text-[10px] text-slate-400 font-bold pointer-events-none">
                  gramas
                </span>
              </div>
            </div>

            <div className="flex-1 min-w-[130px]">
              <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
                📦 Custo Embalagem (R$):
              </label>
              <div className="relative flex items-center">
                <input
                  type="number"
                  min="0"
                  step="0.05"
                  value={customPackCostInput === 0 ? '' : customPackCostInput}
                  onChange={e => setCustomPackCostInput(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-lg pl-3 pr-8 py-1.5 text-xs font-mono font-bold text-white focus:outline-none"
                  placeholder="0.00"
                />
                <span className="absolute right-2.5 text-[10px] text-slate-400 font-bold pointer-events-none">
                  R$
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Controls according to Mode */}
      {mode === 'margin' ? (
        <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-amber-400" />
              <span>Margem de Lucro Alvo:</span>
            </span>
            <span className="text-xl font-black font-mono text-amber-400 tracking-tight">
              {simulatedMargin}%
            </span>
          </div>

          {/* Continuous Range Slider */}
          <input
            type="range"
            min="15"
            max="80"
            step="1"
            value={simulatedMargin}
            onChange={e => setSimulatedMargin(parseInt(e.target.value) || 50)}
            className="w-full accent-amber-500 bg-slate-800 h-2 rounded-lg cursor-pointer transition-all"
          />

          {/* Quick Preset Pills */}
          <div className="flex items-center justify-between gap-1.5 pt-1">
            {[35, 50, 60, 70].map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setSimulatedMargin(m)}
                className={`flex-1 py-1 rounded-lg text-xs font-mono font-bold transition-all border ${
                  simulatedMargin === m
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-black'
                    : 'bg-slate-900 border-slate-700/80 text-slate-300 hover:text-white hover:border-slate-600'
                }`}
              >
                {m}%
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Percent className="w-4 h-4 text-emerald-400" />
              <span>Preço de Venda Desejado (R$):</span>
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full border font-bold ${marginHealth.badge}`}>
              {effectiveMargin.toFixed(1)}% Margem
            </span>
          </div>

          <div className="relative">
            <span className="absolute left-3.5 top-2.5 text-slate-400 font-mono font-bold text-sm">
              R$
            </span>
            <input
              type="number"
              min="1"
              step="0.5"
              value={simulatedPriceInput}
              onChange={e => setSimulatedPriceInput(e.target.value)}
              placeholder="38.00"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xl font-mono font-black text-white focus:outline-none focus:border-emerald-500 shadow-inner"
            />
          </div>
          <span className="text-[11px] text-slate-400 block">
            Digite o preço praticado na loja para calcular o lucro líquido real e a viabilidade.
          </span>
        </div>
      )}

      {/* Main Results Highlight */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-950/60 to-slate-900 border border-emerald-600/40 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300 block">
              Preço Sugerido de Venda
            </span>
            <div className="text-3xl font-black text-emerald-400 font-mono tracking-tight mt-0.5">
              R$ {effectivePrice.toFixed(2)}
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              por {activeFormat.name.toLowerCase()}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300 block">
              Lucro Líquido no Bolso
            </span>
            <div className={`text-2xl font-black font-mono tracking-tight mt-0.5 ${netProfitUnit >= 0 ? 'text-emerald-300' : 'text-rose-400'}`}>
              R$ {netProfitUnit.toFixed(2)}
            </div>
            <span className={`text-[10px] font-bold font-mono ${effectiveMargin >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              ({effectiveMargin.toFixed(1)}% de margem)
            </span>
          </div>
        </div>

        {/* Diagnosis Status Bar */}
        <div className="flex items-center justify-between pt-2 border-t border-emerald-900/60 text-xs">
          <span className="flex items-center gap-1.5 text-slate-300">
            <span>{marginHealth.icon}</span>
            <strong className={marginHealth.color}>{marginHealth.label}</strong>
          </span>

          {mode === 'margin' && Math.round(effectiveMargin) !== pricingParams.targetMargin && (
            <button
              type="button"
              onClick={handleSaveAsGlobalDefault}
              className="text-[11px] font-bold text-amber-300 hover:text-amber-200 underline flex items-center gap-1"
              title="Salvar esta margem como padrão para toda a loja"
            >
              {isSaved ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Salvo!
                </span>
              ) : (
                <span>Tornar Margem Padrão</span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* DRE Visual do Pote: Multi-segment Progress Waterfall */}
      <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <PieChart className="w-3.5 h-3.5 text-cyan-400" />
            Decomposição de Cada Real Cobrado
          </span>
          <span className="text-[11px] font-mono text-slate-400">100% Preço</span>
        </div>

        {/* Multi-segment stacked bar */}
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

        {/* Micro-legend */}
        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-slate-300 pt-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-sky-400 shrink-0" />
            <span className="text-slate-400">Insumos:</span>
            <strong className="text-white font-mono">R$ {productCost.toFixed(2)}</strong>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
            <span className="text-slate-400">Embalagem:</span>
            <strong className="text-white font-mono">R$ {formatPackCost.toFixed(2)}</strong>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-400 shrink-0" />
            <span className="text-slate-400">Rateio Fixo:</span>
            <strong className="text-white font-mono">R$ {overheadPerUnit.toFixed(2)}</strong>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
            <span className="text-slate-400">Taxas & Imp:</span>
            <strong className="text-white font-mono">R$ {totalDeductionsR$.toFixed(2)}</strong>
          </div>
        </div>
      </div>

      {/* Yield & Profit of Current Batch */}
      <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-700/80 flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Potencial da Batelada Atual ({Math.round(batchWeightGrams)}g)
          </span>
          <span className="text-xs text-slate-300 font-medium block mt-0.5">
            Rendimento: <strong className="text-amber-300 font-mono font-bold">{unitsInBatch.toFixed(1)}</strong> {activeFormat.name.toLowerCase()}s
          </span>
        </div>

        <div className="text-right">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            Lucro Líquido Batelada
          </span>
          <span className="text-lg font-black font-mono text-emerald-400">
            R$ {totalBatchNetProfit.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
};
