import React from 'react';
import { BatchAnalysis, NutrientValidation } from '../../types/gelato';
import { CheckCircle2, AlertCircle, ThermometerSnowflake, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';

interface NutrientBarsProps {
  analysis: BatchAnalysis;
}

export const NutrientBars: React.FC<NutrientBarsProps> = ({ analysis }) => {
  const { validations, isBalanced, servingTemperature } = analysis;

  // Extract any items that are NOT 'Ok'
  const labelMap: Record<string, string> = {
    sugars: 'Açúcares',
    fat: 'Gorduras',
    msnf: 'SLNG (Leite)',
    otherSolids: 'Outros Sólidos',
    totalSolids: 'Sólidos Totais',
    water: 'Água',
    pod: 'POD (Poder Adoçante)',
    pac: 'PAC (Anticongelante)',
    protein: 'Proteína'
  };

  const pendingIssues = Object.entries(validations)
    .filter(([key, item]) => item.status !== 'Ok' && (key !== 'protein' || validations.protein.max > 0))
    .map(([key, item]) => {
      const isPercent = key !== 'pod' && key !== 'pac';
      const unit = isPercent ? '%' : '';
      const valStr = isPercent ? (item.val * 100).toFixed(1) : item.val.toFixed(0);
      const minStr = isPercent ? (item.min * 100).toFixed(1) : item.min.toFixed(0);
      const maxStr = isPercent ? (item.max * 100).toFixed(1) : item.max.toFixed(0);

      return {
        key,
        name: labelMap[key] || key,
        status: item.status,
        valStr: `${valStr}${unit}`,
        targetStr: `${minStr}–${maxStr}${unit}`,
        minStr: `${minStr}${unit}`,
        maxStr: `${maxStr}${unit}`
      };
    });

  const renderBar = (
    label: string,
    valItem: NutrientValidation,
    unit: string,
    isPercent: boolean = true
  ) => {
    const { val, min, max, status } = valItem;
    const displayVal = isPercent ? (val * 100).toFixed(1) : val.toFixed(0);
    const displayMin = isPercent ? (min * 100).toFixed(1) : min.toFixed(0);
    const displayMax = isPercent ? (max * 100).toFixed(1) : max.toFixed(0);

    let badgeColor = 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30';
    let barColor = 'bg-emerald-500';
    let valColor = 'text-slate-900 dark:text-slate-100';
    let cardBorder = 'border-slate-200 dark:border-slate-800';

    if (status === 'Baixo') {
      badgeColor = 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30';
      barColor = 'bg-amber-500';
      valColor = 'text-amber-800 dark:text-amber-300';
      cardBorder = 'border-amber-300 dark:border-amber-500/40';
    } else if (status === 'Alto') {
      badgeColor = 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/30';
      barColor = 'bg-rose-500';
      valColor = 'text-rose-800 dark:text-rose-300';
      cardBorder = 'border-rose-300 dark:border-rose-500/40';
    }

    // Relative progress within a safe range (0 to max * 1.35)
    const upperLimit = max > 0 ? max * 1.35 : 1;
    const progressPct = Math.min(Math.max((val / upperLimit) * 100, 0), 100);
    const minMarkerPct = (min / upperLimit) * 100;
    const maxMarkerPct = (max / upperLimit) * 100;

    return (
      <div className={`bg-white dark:bg-slate-900 p-4 rounded-2xl border ${cardBorder} transition-all flex flex-col justify-between shadow-sm`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {label}
          </span>
          <span className={`text-[11px] px-2.5 py-0.5 rounded-full border font-bold ${badgeColor}`}>
            {status}
          </span>
        </div>

        <div className="flex items-baseline justify-between mb-2">
          <span className={`text-2xl font-black font-mono tracking-tight ${valColor}`}>
            {displayVal}
            <span className="text-sm font-bold text-slate-400 ml-0.5">{unit}</span>
          </span>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Alvo: <strong className="text-slate-700 dark:text-slate-300 font-mono">{displayMin}–{displayMax}{unit}</strong>
          </span>
        </div>

        {/* Visual progress bar with target range highlight */}
        <div className="relative w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700/60">
          {/* Target range marker background */}
          <div
            className="absolute top-0 bottom-0 bg-emerald-500/15 border-x border-emerald-500/30"
            style={{ left: `${minMarkerPct}%`, width: `${Math.max(maxMarkerPct - minMarkerPct, 3)}%` }}
            title={`Faixa Ideal: ${displayMin} a ${displayMax}${unit}`}
          />
          {/* Active bar */}
          <div
            className={`h-full rounded-full transition-all duration-300 ${barColor}`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header status bar */}
      <div className={`p-4 sm:p-5 rounded-2xl border shadow-sm transition-all ${
        isBalanced
          ? 'bg-emerald-50/70 border-emerald-300/80 dark:bg-slate-900 dark:border-emerald-500/30'
          : 'bg-amber-50/70 border-amber-300/80 dark:bg-slate-900 dark:border-amber-500/30'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                isBalanced
                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-slate-800 dark:text-emerald-400 dark:border-emerald-500/30'
                  : 'bg-amber-100 text-amber-700 border border-amber-200 dark:bg-slate-800 dark:text-amber-400 dark:border-amber-500/30'
              }`}
            >
              {isBalanced ? (
                <CheckCircle2 className="w-6 h-6 animate-pulse" />
              ) : (
                <AlertCircle className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
                  {isBalanced ? 'Receita Perfeitamente Balanceada' : 'Ajustes Necessários na Fórmula'}
                </h3>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    isBalanced
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-slate-800 dark:text-emerald-300 dark:border-emerald-500/30'
                      : 'bg-amber-100 text-amber-800 border border-amber-200 dark:bg-slate-800 dark:text-amber-300 dark:border-amber-500/30'
                  }`}
                >
                  {isBalanced ? 'Equilibrado' : 'Revisar'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                {isBalanced
                  ? 'Todos os parâmetros bromatológicos e térmicos estão perfeitamente dentro da faixa ideal do estilo.'
                  : 'Os parâmetros listados abaixo estão fora das metas de textura, maciez ou dulçor:'}
              </p>
            </div>
          </div>

          {/* Temperature Badge */}
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-900 dark:bg-slate-950 dark:border-cyan-900/60 dark:text-cyan-200 self-start sm:self-auto shadow-sm">
            <ThermometerSnowflake className="w-6 h-6 text-cyan-600 dark:text-cyan-400 shrink-0" />
            <div>
              <div className="text-[11px] uppercase font-bold tracking-wider text-cyan-700 dark:text-cyan-400">
                Temp. Serviço (Vitrine)
              </div>
              <div className="text-xl font-black font-mono text-cyan-950 dark:text-cyan-200">
                {servingTemperature} °C
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Explanation Pills of Out-of-Range Parameters */}
        {!isBalanced && pendingIssues.length > 0 && (
          <div className="mt-4 pt-3.5 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
              <span>⚠️</span>
              <span>O que precisa ser ajustado:</span>
            </span>
            <div className="flex flex-wrap gap-2">
              {pendingIssues.map(issue => (
                <div
                  key={issue.key}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-2 transition-colors shadow-sm ${
                    issue.status === 'Baixo'
                      ? 'bg-amber-50 text-slate-900 border-amber-300 dark:bg-slate-800 dark:text-slate-100 dark:border-amber-500/40'
                      : 'bg-rose-50 text-slate-900 border-rose-300 dark:bg-slate-800 dark:text-slate-100 dark:border-rose-500/40'
                  }`}
                >
                  {issue.status === 'Baixo' ? (
                    <ArrowDownCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  ) : (
                    <ArrowUpCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                  )}
                  <span>
                    <strong className="font-bold text-slate-900 dark:text-white">{issue.name}:</strong>{' '}
                    está em{' '}
                    <span className={`font-mono font-black ${
                      issue.status === 'Baixo' ? 'text-amber-800 dark:text-amber-300' : 'text-rose-800 dark:text-rose-300'
                    }`}>
                      {issue.valStr}
                    </span>{' '}
                    <span className="text-slate-600 dark:text-slate-300 font-medium">
                      ({issue.status === 'Baixo' ? `abaixo do mín. ${issue.minStr}` : `acima do máx. ${issue.maxStr}`})
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Grid of parameters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {renderBar('Açúcares', validations.sugars, '%', true)}
        {renderBar('Gorduras', validations.fat, '%', true)}
        {renderBar('SLNG (Leite)', validations.msnf, '%', true)}
        {renderBar('Outros Sólidos', validations.otherSolids, '%', true)}
        {renderBar('Sólidos Totais', validations.totalSolids, '%', true)}
        {renderBar('Água', validations.water, '%', true)}
        {renderBar('POD (Poder Adoçante)', validations.pod, '', false)}
        {renderBar('PAC (Anticongelante)', validations.pac, '', false)}
      </div>

      {validations.protein.max > 0 && (
        <div className="mt-2">
          {renderBar('Proteína (Gelatos Proteicos)', validations.protein, '%', true)}
        </div>
      )}
    </div>
  );
};
