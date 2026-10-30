import React from 'react';
import { BatchAnalysis, NutrientValidation } from '../../types/gelato';
import {
  CheckCircle2,
  AlertCircle,
  ThermometerSnowflake,
  ArrowDownCircle,
  ArrowUpCircle,
  Check,
  Sparkles,
  Info
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
    label: 'SLNG (Sólidos do Leite)',
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
        {/* Top Header: Nutrient Name & Target Range */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <span className="text-sm select-none">{meta.icon}</span>
              <span>{meta.label}</span>
            </span>

            {/* Status Pill with Actionable Delta */}
            {status === 'Ok' ? (
              <span className="text-[11px] px-2.5 py-0.5 rounded-full border font-bold bg-emerald-500/15 text-emerald-300 border-emerald-500/30 flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />
                <span>No Alvo</span>
              </span>
            ) : status === 'Baixo' ? (
              <span className="text-[11px] px-2 py-0.5 rounded-full border font-bold bg-amber-500/20 text-amber-300 border-amber-500/40 flex items-center gap-1 animate-pulse">
                <span>↓ -{deltaStr}</span>
                <span className="text-[10px] uppercase">Baixo</span>
              </span>
            ) : (
              <span className="text-[11px] px-2 py-0.5 rounded-full border font-bold bg-rose-500/20 text-rose-300 border-rose-500/40 flex items-center gap-1 animate-pulse">
                <span>↑ +{deltaStr}</span>
                <span className="text-[10px] uppercase">Alto</span>
              </span>
            )}
          </div>

          {/* Value and Target Range Header */}
          <div className="flex items-baseline justify-between mt-2 mb-2.5">
            <div className="flex items-baseline gap-1">
              <span className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${valColor}`}>
                {displayVal}
              </span>
              <span className="text-sm font-bold text-slate-400">{unit}</span>
            </div>

            <div className="text-right">
              <span className="text-[11px] font-medium text-slate-400 block leading-tight">
                Faixa Alvo
              </span>
              <span className="text-xs font-mono font-bold text-slate-200">
                {displayMin}–{displayMax}{unit}
              </span>
            </div>
          </div>
        </div>

        {/* Precision Bullet Graph Bar */}
        <div>
          <div className="relative w-full h-3.5 bg-slate-950 rounded-full overflow-hidden border border-slate-700/80 shadow-inner">
            {/* 1. Target range safe zone highlight (luminous background track) */}
            <div
              className="absolute top-0 bottom-0 bg-emerald-500/15 border-x border-emerald-400/40 pointer-events-none z-10 transition-all"
              style={{
                left: `${minMarkerPct}%`,
                width: `${Math.max(maxMarkerPct - minMarkerPct, 2)}%`
              }}
              title={`Faixa Ideal: ${displayMin} a ${displayMax}${unit}`}
            />

            {/* 2. Sweet spot center marker */}
            <div
              className="absolute top-0 bottom-0 w-[1px] bg-emerald-400/30 z-10 pointer-events-none"
              style={{ left: `${midMarkerPct}%` }}
              title={`Centro da Faixa: ~${displayMid}${unit}`}
            />

            {/* 3. Active progress bar fill */}
            <div
              className={`h-full rounded-full transition-all duration-300 ${barGradient} ${status === 'Ok' ? meta.glowColor : ''}`}
              style={{ width: `${progressPct}%` }}
            />

            {/* 4. Minimum Limit Marker: Solid White Glowing Tick */}
            <div
              className="absolute top-0 bottom-0 w-[2.5px] bg-white shadow-[0_0_5px_rgba(255,255,255,0.95)] z-20 pointer-events-none"
              style={{ left: `calc(${minMarkerPct}% - 1px)` }}
              title={`Limite Mínimo: ${displayMin}${unit}`}
            />

            {/* 5. Maximum Limit Marker: Solid White Glowing Tick */}
            <div
              className="absolute top-0 bottom-0 w-[2.5px] bg-white shadow-[0_0_5px_rgba(255,255,255,0.95)] z-20 pointer-events-none"
              style={{ left: `calc(${maxMarkerPct}% - 1px)` }}
              title={`Limite Máximo: ${displayMax}${unit}`}
            />
          </div>

          {/* Clean, Non-Redundant Micro-Scale */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mt-1.5 px-0.5">
            <span title={`Mínimo: ${displayMin}${unit}`}>
              Mín: <strong className="text-slate-200">{displayMin}{unit}</strong>
            </span>

            <span className="text-[10px] font-sans font-semibold text-slate-500">
              {status === 'Ok' ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                  No Alvo Ideal
                </span>
              ) : (
                <span>Centro: ~{displayMid}{unit}</span>
              )}
            </span>

            <span title={`Máximo: ${displayMax}${unit}`}>
              Máx: <strong className="text-slate-200">{displayMax}{unit}</strong>
            </span>
          </div>
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
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Status Message */}
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

          {/* Interactive Showcase Temperature & Texture Gauge */}
          <div className="flex items-center gap-3.5 px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700/80 shadow-md">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center shrink-0">
              <ThermometerSnowflake className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  Temp. Vitrine
                </span>
                <span className={`text-[10px] px-2 py-0.2 rounded-full border font-bold ${textureVerdict.badgeColor}`}>
                  {textureVerdict.title}
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-xl font-black font-mono text-cyan-300">
                  {servingTemperature} °C
                </span>
                <span className="text-[11px] text-slate-400 hidden xl:inline">
                  (PAC: {Math.round(pacValue)})
                </span>
              </div>
            </div>
          </div>
        </div>

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
