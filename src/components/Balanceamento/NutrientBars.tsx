import React, { useState } from 'react';
import { BatchAnalysis, NutrientValidation } from '../../types/gelato';
import {
  CheckCircle2,
  AlertCircle,
  ThermometerSnowflake,
  ArrowDownCircle,
  ArrowUpCircle,
  Check,
  Sparkles,
  Info,
  AlertTriangle,
  Store,
  Package,
  Snowflake,
  Wind
} from 'lucide-react';

interface NutrientBarsProps {
  analysis: BatchAnalysis;
}

interface NutrientMeta {
  label: string;
  icon: string;
  unit: string;
  isPercent: boolean;
  barGradient: string;
  glowColor: string;
  accentText: string;
  description: string;
}

const NUTRIENT_METAS: Record<string, NutrientMeta> = {
  sugars: {
    label: 'Açúcares',
    icon: '🍬',
    unit: '%',
    isPercent: true,
    barGradient: 'from-amber-500 to-amber-300',
    glowColor: 'shadow-amber-500/20',
    accentText: 'text-amber-300',
    description: 'Doçura e controle do congelamento'
  },
  fat: {
    label: 'Gorduras',
    icon: '🧈',
    unit: '%',
    isPercent: true,
    barGradient: 'from-amber-400 to-yellow-300',
    glowColor: 'shadow-yellow-500/20',
    accentText: 'text-yellow-300',
    description: 'Cremosidade e textura na boca'
  },
  msnf: {
    label: 'SLNG (Leite)',
    icon: '🥛',
    unit: '%',
    isPercent: true,
    barGradient: 'from-sky-400 to-blue-500',
    glowColor: 'shadow-sky-500/20',
    accentText: 'text-sky-300',
    description: 'Proteínas lácteas e retenção de água'
  },
  otherSolids: {
    label: 'Outros Sólidos',
    icon: '🌾',
    unit: '%',
    isPercent: true,
    barGradient: 'from-orange-400 to-amber-500',
    glowColor: 'shadow-orange-500/20',
    accentText: 'text-orange-300',
    description: 'Fibras, amidos e cacau'
  },
  totalSolids: {
    label: 'Sólidos Totais',
    icon: '🧱',
    unit: '%',
    isPercent: true,
    barGradient: 'from-emerald-400 to-teal-400',
    glowColor: 'shadow-emerald-500/20',
    accentText: 'text-emerald-300',
    description: 'Estrutura seca total da calda'
  },
  water: {
    label: 'Água',
    icon: '💧',
    unit: '%',
    isPercent: true,
    barGradient: 'from-cyan-400 to-sky-400',
    glowColor: 'shadow-cyan-500/20',
    accentText: 'text-cyan-300',
    description: 'Solvente base congelável'
  },
  pod: {
    label: 'POD (Poder Adoçante)',
    icon: '🍯',
    unit: '',
    isPercent: false,
    barGradient: 'from-rose-400 to-pink-500',
    glowColor: 'shadow-rose-500/20',
    accentText: 'text-rose-300',
    description: 'Sensação gustativa de dulçor'
  },
  pac: {
    label: 'PAC (Anticongelante)',
    icon: '❄️',
    unit: '',
    isPercent: false,
    barGradient: 'from-indigo-400 to-violet-500',
    glowColor: 'shadow-indigo-500/20',
    accentText: 'text-indigo-300',
    description: 'Espatulabilidade e dureza a -12°C'
  },
  protein: {
    label: 'Proteína',
    icon: '⚡',
    unit: '%',
    isPercent: true,
    barGradient: 'from-purple-400 to-fuchsia-500',
    glowColor: 'shadow-purple-500/20',
    accentText: 'text-purple-300',
    description: 'Aporte de proteína do leite/vegetal'
  }
};

export const NutrientBars: React.FC<NutrientBarsProps> = ({ analysis }) => {
  const { validations, isBalanced, servingTemperature } = analysis;
  const [thermalMode, setThermalMode] = useState<'vitrine' | 'freezer'>('vitrine');
  const corvitto = analysis.corvittoMetrics;
  const sandiness = analysis.sandinessRisk;
  const emulsion = analysis.emulsionMetrics;

  const pendingIssues = Object.entries(validations)
    .filter(([key, item]) => item.status !== 'Ok' && (key !== 'protein' || validations.protein.max > 0))
    .map(([key, item]) => {
      const meta = NUTRIENT_METAS[key] || {
        label: key,
        icon: '📊',
        unit: '%',
        isPercent: true
      };
      const isPercent = meta.isPercent;
      const unit = meta.unit;
      const valStr = isPercent ? (item.val * 100).toFixed(1) : item.val.toFixed(0);
      const minStr = isPercent ? (item.min * 100).toFixed(1) : item.min.toFixed(0);
      const maxStr = isPercent ? (item.max * 100).toFixed(1) : item.max.toFixed(0);

      const delta =
        item.status === 'Baixo'
          ? Math.max(0, item.min - item.val)
          : Math.max(0, item.val - item.max);
      const deltaStr = isPercent ? (delta * 100).toFixed(1) : delta.toFixed(0);

      return {
        key,
        name: meta.label,
        icon: meta.icon,
        status: item.status,
        valStr: `${valStr}${unit}`,
        minStr: `${minStr}${unit}`,
        maxStr: `${maxStr}${unit}`,
        deltaStr: `${deltaStr}${unit}`
      };
    });

  // Texture and scoopability assessment based on Cryoscopic Serving Temperature
  const pacValue = analysis.totals.pac;
  let textureVerdict = {
    title: 'Espatulabilidade Ideal',
    desc: 'Ponto de vitrine equilibrado (-11.5°C a -13.2°C: ~75% de água congelada)',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
  };

  if (servingTemperature > -11.0) {
    textureVerdict = {
      title: 'Consistência Firme / Dureza Elevada',
      desc: 'Pouca água congelada a -12°C; requer vitrine mais amena ou elevar açúcares/PAC',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40'
    };
  } else if (servingTemperature < -13.5) {
    textureVerdict = {
      title: 'Massa Macia / Ponto de Fusão Rápido',
      desc: 'Excesso de anticongelante; risco de desmanchar na vitrine a -12°C',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40'
    };
  }

  let freezerVerdictBadge = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
  if (corvitto?.freezerStatus === 'duro') {
    freezerVerdictBadge = 'bg-sky-500/20 text-sky-300 border-sky-500/40';
  } else if (corvitto?.freezerStatus === 'firme') {
    freezerVerdictBadge = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
  } else if (corvitto?.freezerStatus === 'colher') {
    freezerVerdictBadge = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
  } else if (corvitto?.freezerStatus === 'muito_macio') {
    freezerVerdictBadge = 'bg-rose-500/20 text-rose-300 border-rose-500/40';
  }

  const renderBulletCard = (key: string, valItem: NutrientValidation) => {
    const meta = NUTRIENT_METAS[key] || {
      label: key,
      icon: '📊',
      unit: '%',
      isPercent: true,
      barGradient: 'from-emerald-400 to-teal-400',
      glowColor: 'shadow-emerald-500/20',
      accentText: 'text-white',
      description: ''
    };

    const { val, min, max, status } = valItem;
    const isPercent = meta.isPercent;
    const unit = meta.unit;
    const displayVal = isPercent ? (val * 100).toFixed(1) : val.toFixed(0);
    const displayMin = isPercent ? (min * 100).toFixed(1) : min.toFixed(0);
    const displayMax = isPercent ? (max * 100).toFixed(1) : max.toFixed(0);
    const midVal = (min + max) / 2;
    const displayMid = isPercent ? (midVal * 100).toFixed(1) : midVal.toFixed(0);

    // Dynamic upper bound so bar never clips
    const upperLimit = Math.max(max * 1.35, val * 1.15, 0.01);
    const progressPct = Math.min(Math.max((val / upperLimit) * 100, 0), 100);
    const minMarkerPct = Math.min(Math.max((min / upperLimit) * 100, 0), 100);
    const maxMarkerPct = Math.min(Math.max((max / upperLimit) * 100, 0), 100);
    const midMarkerPct = (minMarkerPct + maxMarkerPct) / 2;

    // Delta calculation
    let deltaStr = '';
    if (status === 'Baixo') {
      const delta = Math.max(0, min - val);
      deltaStr = `${isPercent ? (delta * 100).toFixed(1) : delta.toFixed(0)}${unit}`;
    } else if (status === 'Alto') {
      const delta = Math.max(0, val - max);
      deltaStr = `${isPercent ? (delta * 100).toFixed(1) : delta.toFixed(0)}${unit}`;
    }

    // Color definitions
    let cardBorder = 'border-slate-700/80 hover:border-slate-600 bg-slate-900/90';
    let barGradient = `bg-gradient-to-r ${meta.barGradient}`;
    let valColor = 'text-white';

    if (status === 'Baixo') {
      cardBorder = 'border-amber-500/50 bg-amber-950/20';
      barGradient = 'bg-gradient-to-r from-amber-500 to-yellow-500';
      valColor = 'text-amber-300';
    } else if (status === 'Alto') {
      cardBorder = 'border-rose-500/50 bg-rose-950/20';
      barGradient = 'bg-gradient-to-r from-rose-500 to-red-500';
      valColor = 'text-rose-300';
    }

    return (
      <div
        key={key}
        className={`p-4 rounded-2xl border ${cardBorder} transition-all flex flex-col justify-between shadow-lg relative group`}
      >
        {/* Top Header: Nutrient Name & Status */}
        <div>
          <div className="flex items-center justify-between gap-1.5 mb-1.5 min-h-[26px]">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5 min-w-0">
              <span className="text-sm select-none shrink-0">{meta.icon}</span>
              <span className="truncate" title={meta.label}>{meta.label}</span>
            </span>

            {/* Status Pill with Actionable Delta */}
            {status === 'Ok' ? (
              <span className="text-[11px] px-2.5 py-0.5 rounded-full border font-bold bg-emerald-500/15 text-emerald-300 border-emerald-500/30 flex items-center gap-1 whitespace-nowrap shrink-0">
                <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />
                <span>No Alvo</span>
              </span>
            ) : status === 'Baixo' ? (
              <span className="text-[11px] px-2 py-0.5 rounded-full border font-bold bg-amber-500/20 text-amber-300 border-amber-500/40 flex items-center gap-1 animate-pulse whitespace-nowrap shrink-0">
                <span>↓ -{deltaStr}</span>
                <span className="text-[10px] uppercase">Baixo</span>
              </span>
            ) : (
              <span className="text-[11px] px-2 py-0.5 rounded-full border font-bold bg-rose-500/20 text-rose-300 border-rose-500/40 flex items-center gap-1 animate-pulse whitespace-nowrap shrink-0">
                <span>↑ +{deltaStr}</span>
                <span className="text-[10px] uppercase">Alto</span>
              </span>
            )}
          </div>

          {/* Value Display */}
          <div className="flex items-baseline gap-1 mt-1 mb-2.5">
            <span className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${valColor}`}>
              {displayVal}
            </span>
            <span className="text-sm font-bold text-slate-400">{unit}</span>
          </div>
        </div>

        {/* Precision Target Range Bar & Needle Marker */}
        <div>
          <div className="relative w-full h-4 bg-slate-950/90 rounded-full border border-slate-800 shadow-inner flex items-center">
            {/* 1. Faixa Colorida: Intervalo Recomendado [Mínimo -> Máximo] */}
            <div
              className={`absolute top-0.5 bottom-0.5 rounded-full transition-all duration-300 bg-gradient-to-r ${meta.barGradient} shadow-md opacity-90`}
              style={{
                left: `${minMarkerPct}%`,
                width: `${Math.max(maxMarkerPct - minMarkerPct, 2)}%`
              }}
              title={`Faixa Recomendada: ${displayMin} a ${displayMax}${unit}`}
            >
              {/* Delimitadores discretos nas pontas da faixa */}
              <div className="absolute left-0 top-0 bottom-0 w-[1.5px] bg-white/60 rounded-l" />
              <div className="absolute right-0 top-0 bottom-0 w-[1.5px] bg-white/60 rounded-r" />

              {/* Centro de referência da faixa */}
              <div className="absolute top-0 bottom-0 w-[1px] bg-white/20 left-1/2 pointer-events-none" />
            </div>

            {/* 2. Marcador Vertical Bem Visível (Agulha de Alta Precisão) no Valor Calculado */}
            <div
              className={`absolute top-[-3px] bottom-[-3px] w-[4px] rounded-full z-20 transition-all duration-300 pointer-events-none ${
                status === 'Ok'
                  ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,1),0_0_14px_rgba(52,211,153,0.9)] ring-1 ring-emerald-400'
                  : status === 'Baixo'
                  ? 'bg-amber-300 shadow-[0_0_10px_rgba(245,158,11,1)] ring-1 ring-amber-400 animate-pulse'
                  : 'bg-rose-400 shadow-[0_0_10px_rgba(244,63,94,1)] ring-1 ring-rose-500 animate-pulse'
              }`}
              style={{ left: `calc(${progressPct}% - 2px)` }}
              title={`Valor Calculado: ${displayVal}${unit}`}
            />
          </div>

          {/* Clean, Non-Redundant Micro-Scale */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mt-1.5 px-0.5">
            <span title={`Mínimo: ${displayMin}${unit}`}>
              Mín: <strong className="text-slate-200">{displayMin}{unit}</strong>
            </span>

            <span title={`Máximo: ${displayMax}${unit}`}>
              Máx: <strong className="text-slate-200">{displayMax}{unit}</strong>
            </span>
          </div>

          {/* Razão Gordura : SLNG & Overrun (Carpigiani) */}
          {key === 'fat' && emulsion && emulsion.status !== 'sorbet' && (
            <div className="mt-2.5 pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 flex items-center justify-between">
              <span title="Relação Lipídica Carpigiani: Gordura / SLNG (Alvo ideal: 0.75 a 1.25)">
                Razão Gordura:SLNG:
              </span>
              <span className="flex items-center gap-1 font-mono font-bold">
                <strong className={
                  emulsion.status === 'ideal' ? 'text-emerald-300' :
                  emulsion.status === 'gorduroso' ? 'text-amber-300' : 'text-sky-300'
                }>
                  {emulsion.fatMsnfRatio} : 1
                </strong>
                <span className="text-[9px] text-slate-400 font-normal">
                  (~{emulsion.overrunEstimatePct}% ar)
                </span>
              </span>
            </div>
          )}

          {/* Alerta Dinâmico de Arenosidade (Luca Caviezel) */}
          {key === 'msnf' && sandiness && (
            <div className={`mt-2.5 pt-2 border-t text-[10px] sm:text-[11px] flex items-start gap-1.5 transition-all ${sandiness.isAtRisk ? 'border-amber-500/50 text-amber-300 bg-amber-950/40 p-2 rounded-xl border' : 'border-slate-800/80 text-slate-400'}`}>
              {sandiness.isAtRisk ? (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-amber-200">Alerta Arenosidade (Caviezel):</span>
                    <span className="block text-[10px] text-amber-300/90 leading-tight mt-0.5">
                      SLNG ({displayVal}%) excede teto seguro de {(sandiness.maxSafeMsnf * 100).toFixed(1)}% p/ água disponível. Risco de cristalizar lactose.
                    </span>
                  </div>
                </>
              ) : valItem.val > 0.03 ? (
                <div className="flex items-center gap-1 text-[10px] text-emerald-400/90">
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span>Teto seguro anti-arenosidade: {(sandiness.maxSafeMsnf * 100).toFixed(1)}%</span>
                </div>
              ) : null}
            </div>
          )}

          {/* Diagnóstico Corvitto de PAC na Água Livre */}
          {key === 'pac' && corvitto && (
            <div className="mt-2.5 pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 flex items-center justify-between">
              <span title="Índice Angelo Corvitto: PAC por kg de água pura disponível">
                PAC Água Livre (Corvitto):
              </span>
              <strong className="text-cyan-300 font-mono font-bold">
                {corvitto.pacWater}
              </strong>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header status & Showcase Temperature Dashboard */}
      <div
        className={`p-5 rounded-2xl border shadow-xl transition-all ${
          isBalanced
            ? 'bg-slate-800/95 border-emerald-500/40'
            : 'bg-slate-800/95 border-amber-500/40'
        }`}
      >
        {/* Header Status & Smart Dashboard Cards */}
        <div className="space-y-4">
          {/* Balance Status Banner */}
          <div className="flex items-start sm:items-center gap-4">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
                isBalanced
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
              }`}
            >
              {isBalanced ? (
                <CheckCircle2 className="w-7 h-7 animate-pulse text-emerald-400" />
              ) : (
                <AlertCircle className="w-7 h-7 text-amber-400" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  {isBalanced ? 'Receita Perfeitamente Balanceada' : 'Ajustes Recomendados na Fórmula'}
                </h3>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider border ${
                    isBalanced
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}
                >
                  {isBalanced ? 'Equilibrado' : 'Revisar Metas'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                {isBalanced
                  ? 'Todos os parâmetros bromatológicos e térmicos estão perfeitamente calibrados para o estilo selecionado.'
                  : 'Alguns parâmetros estão fora da faixa técnica. Use os controles de peso da calda para ajustar:'}
              </p>
            </div>
          </div>

          {/* Dual Intelligence Cards: 1. Comportamento Térmico  |  2. Overrun & Emulsão (Sempre Visível) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pt-1">
            
            {/* CARD 1: Comportamento Térmico de Serviço */}
            <div className="bg-slate-900/95 p-3.5 rounded-2xl border border-slate-700/80 shadow-md flex flex-col justify-between space-y-3">
              {/* Header do Card com Toggle Switch */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  Cenário Térmico de Serviço
                </span>

                <div className="flex bg-slate-950/90 p-1 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setThermalMode('vitrine')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      thermalMode === 'vitrine'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="Ponto de espatulabilidade para vitrine comercial ventilada (-11°C a -13°C)"
                  >
                    <Store className="w-3.5 h-3.5" />
                    <span>Vitrine (-12°C)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setThermalMode('freezer')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      thermalMode === 'freezer'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="Diagnóstico Angelo Corvitto para potes de delivery / freezer doméstico (-18°C)"
                  >
                    <Package className="w-3.5 h-3.5" />
                    <span>Pote Freezer (-18°C)</span>
                  </button>
                </div>
              </div>

              {/* Corpo de Métricas Térmicas */}
              {thermalMode === 'vitrine' ? (
                <div className="flex items-center gap-3 py-0.5">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center shrink-0">
                    <ThermometerSnowflake className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                        Temp. Serviço
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${textureVerdict.badgeColor}`}>
                        {textureVerdict.title}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-xl sm:text-2xl font-black font-mono text-cyan-300">
                        {servingTemperature} °C
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        (PAC: {Math.round(pacValue)})
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 py-0.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
                    <Snowflake className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                        PAC Água Livre (Corvitto)
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${freezerVerdictBadge}`}>
                        {corvitto?.freezerLabel}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-xl sm:text-2xl font-black font-mono text-amber-300">
                        {corvitto?.pacWater}
                      </span>
                      <span className="text-xs text-slate-400">
                        {corvitto?.neededPacForFreezer && corvitto.neededPacForFreezer > 0
                          ? `(+${corvitto.neededPacForFreezer} PAC p/ ponto de colher)`
                          : `(ponto de colher imediato)`}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* CARD 2: Emulsão & Overrun (Aeração) — SEMPRE VISÍVEL E DESTACADO */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-purple-950/30 p-3.5 rounded-2xl border border-purple-500/30 shadow-md flex flex-col justify-between space-y-3">
              {/* Header do Card de Overrun */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 text-purple-300">
                  <Wind className="w-3.5 h-3.5 text-purple-400" />
                  <span className="text-[10px] uppercase font-bold tracking-wider">
                    Emulsão & Overrun (Carpigiani)
                  </span>
                </div>

                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${
                    emulsion?.status === 'ideal'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : emulsion?.status === 'gorduroso'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : emulsion?.status === 'magro'
                      ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                      : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                  }`}
                  title={emulsion?.advice}
                >
                  {emulsion?.statusLabel}
                </span>
              </div>

              {/* Corpo com Overrun em Grande Destaque e Razão Lipídica */}
              <div className="flex items-center justify-between gap-4 py-0.5">
                {/* Bloco de Overrun */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center shrink-0">
                    <Wind className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                      Overrun Estimado
                    </span>
                    <div className="flex items-baseline gap-1.5 mt-0.5">
                      <span className="text-xl sm:text-2xl font-black font-mono text-purple-200">
                        ~{emulsion?.overrunEstimatePct}%
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        ({emulsion?.overrunRange})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bloco de Razão Lipídica */}
                <div className="text-right shrink-0">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                    Gordura : SLNG
                  </span>
                  <span className="text-base sm:text-lg font-black font-mono text-slate-200 block mt-0.5">
                    {emulsion?.status === 'sorbet' ? 'Sorbet' : `${emulsion?.fatMsnfRatio} : 1`}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium block">
                    {emulsion?.status === 'sorbet' ? 'Base Água' : 'Alvo: 0.75 a 1.25'}
                  </span>
                </div>
              </div>

              {/* Mini-Gauge de Nível de Aeração */}
              <div className="space-y-1">
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-sky-400 via-purple-400 to-emerald-400 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.max(12, (((emulsion?.overrunEstimatePct || 30) - 15) / 30) * 100))}%`
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono">
                  <span>Denso (18%)</span>
                  <span>Clássico Italiano (~32%)</span>
                  <span>Aerado (45%)</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Alerta Destacado de Arenosidade (Caviezel) */}
        {sandiness?.isAtRisk && (
          <div className="mt-3.5 p-3 bg-amber-950/40 rounded-xl border border-amber-500/50 text-xs text-amber-200 flex items-start gap-2.5 shadow-sm">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <strong className="text-amber-300 font-bold block">
                Alerta de Arenosidade (Regra Áurea de Luca Caviezel):
              </strong>
              <p className="text-amber-200/90 leading-relaxed text-[11px]">
                O teor de sólidos do leite (SLNG: {(sandiness.currentMsnf * 100).toFixed(1)}%) ultrapassa o limite seguro de saturação da água livre (máx. {(sandiness.maxSafeMsnf * 100).toFixed(1)}%). Sob oscilação térmica na vitrine, a lactose pode precipitar em microcristais perceptíveis na língua. Recomenda-se reduzir leite em pó ou elevar a proporção de leite integral/água.
              </p>
            </div>
          </div>
        )}

        {/* Detailed Explanation Pills of Out-of-Range Parameters */}
        {!isBalanced && pendingIssues.length > 0 && (
          <div className="mt-4 pt-3.5 border-t border-slate-700/80 space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Info className="w-4 h-4" />
                <span>O que precisa ser calibrado na calda:</span>
              </span>
              <span className="text-xs text-slate-400">
                Altere os pesos dos insumos na tabela abaixo para entrar na meta.
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {pendingIssues.map(issue => (
                <div
                  key={issue.key}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-2 transition-colors shadow-sm ${
                    issue.status === 'Baixo'
                      ? 'bg-amber-500/10 text-slate-100 border-amber-500/40'
                      : 'bg-rose-500/10 text-slate-100 border-rose-500/40'
                  }`}
                >
                  {issue.status === 'Baixo' ? (
                    <ArrowDownCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  ) : (
                    <ArrowUpCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span>
                    <strong className="font-bold text-white">{issue.name}:</strong>{' '}
                    está em{' '}
                    <span
                      className={`font-mono font-black ${
                        issue.status === 'Baixo' ? 'text-amber-300' : 'text-rose-300'
                      }`}
                    >
                      {issue.valStr}
                    </span>{' '}
                    <span className="text-slate-300 font-medium">
                      ({issue.status === 'Baixo' ? `faltam ${issue.deltaStr} p/ mín. ${issue.minStr}` : `excesso de ${issue.deltaStr} sobre máx. ${issue.maxStr}`})
                    </span>
                  </span>
                </div>
              ))}
            </div>

            {/* Smart Culinary Advice */}
            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-700/80 text-xs text-slate-300 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <strong className="text-amber-300 font-bold block">
                  Dica do Mestre Gelatiere para Calibração Rápida:
                </strong>
                <p className="text-slate-300 leading-relaxed">
                  {validations.pac.status === 'Baixo' && (
                    <span>
                      • <strong>PAC Baixo:</strong> Substitua uma fração do Açúcar Sacarose por Dextrose (cada 10g de Dextrose aumentam ~19 pontos de PAC mantendo sólidos e reduzindo o dulçor).{' '}
                    </span>
                  )}
                  {validations.pac.status === 'Alto' && (
                    <span>
                      • <strong>PAC Alto:</strong> Reduza a Dextrose ou reduza açúcares totais para evitar que o gelato derreta rápido na vitrine.{' '}
                    </span>
                  )}
                  {validations.fat.status === 'Baixo' && (
                    <span>
                      • <strong>Gordura Baixa:</strong> Aumente o Creme de Leite 35% ou adicione manteiga/pasta oleaginosa para trazer cremosidade.{' '}
                    </span>
                  )}
                  {validations.fat.status === 'Alto' && (
                    <span>
                      • <strong>Gordura Alta:</strong> Substitua parte do Creme de Leite por Leite Integral para manter a calda fluida.{' '}
                    </span>
                  )}
                  {validations.totalSolids.status === 'Baixo' && (
                    <span>
                      • <strong>Sólidos Totais Baixos:</strong> Aumente o Leite em Pó Desnatado ou açúcares para evitar formação de cristais de gelo.{' '}
                    </span>
                  )}
                  {corvitto?.neededPacForFreezer && corvitto.neededPacForFreezer > 0 && (
                    <span>
                      • <strong>Dica Corvitto para Potes de Entrega / Freezer Doméstico (-18°C):</strong> {corvitto.freezerAdvice}{' '}
                    </span>
                  )}
                  {emulsion && emulsion.status === 'gorduroso' && (
                    <span>
                      • <strong>Estabilidade de Emulsão (Carpigiani):</strong> {emulsion.advice}{' '}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Grid of 8 Nutrient Bullet Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {renderBulletCard('sugars', validations.sugars)}
        {renderBulletCard('fat', validations.fat)}
        {renderBulletCard('msnf', validations.msnf)}
        {renderBulletCard('otherSolids', validations.otherSolids)}
        {renderBulletCard('totalSolids', validations.totalSolids)}
        {renderBulletCard('water', validations.water)}
        {renderBulletCard('pod', validations.pod)}
        {renderBulletCard('pac', validations.pac)}
      </div>

      {validations.protein.max > 0 && (
        <div className="mt-2">
          {renderBulletCard('protein', validations.protein)}
        </div>
      )}
    </div>
  );
};
