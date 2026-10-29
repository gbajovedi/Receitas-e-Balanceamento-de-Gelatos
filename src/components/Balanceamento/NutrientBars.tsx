import React from 'react';
import { BatchAnalysis, NutrientValidation } from '../../types/gelato';
import { CheckCircle2, AlertCircle, ThermometerSnowflake } from 'lucide-react';

interface NutrientBarsProps {
  analysis: BatchAnalysis;
}

export const NutrientBars: React.FC<NutrientBarsProps> = ({ analysis }) => {
  const { validations, isBalanced, servingTemperature } = analysis;

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

    let badgeColor = 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40';
    let barColor = 'bg-emerald-400';
    let valColor = 'text-white';

    if (status === 'Baixo') {
      badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/50';
      barColor = 'bg-amber-400';
      valColor = 'text-amber-200';
    } else if (status === 'Alto') {
      badgeColor = 'bg-rose-500/20 text-rose-300 border-rose-500/50';
      barColor = 'bg-rose-400';
      valColor = 'text-rose-200';
    }

    // Relative progress within a safe range (0 to max * 1.3)
    const upperLimit = max > 0 ? max * 1.35 : 1;
    const progressPct = Math.min(Math.max((val / upperLimit) * 100, 0), 100);
    const minMarkerPct = (min / upperLimit) * 100;
    const maxMarkerPct = (max / upperLimit) * 100;

    return (
      <div className="bg-slate-800/80 hover:bg-slate-800 p-4 rounded-xl border border-slate-700/80 transition-all flex flex-col justify-between shadow-sm hover:border-slate-600">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            {label}
          </span>
          <span className={`text-xs px-2.5 py-0.5 rounded-full border font-bold ${badgeColor}`}>
            {status}
          </span>
        </div>

        <div className="flex items-baseline justify-between mb-2">
          <span className={`text-2xl font-black font-mono tracking-tight ${valColor}`}>
            {displayVal}
            <span className="text-sm font-bold text-slate-400 ml-0.5">{unit}</span>
          </span>
          <span className="text-xs font-medium text-slate-400">
            Alvo: <strong className="text-slate-300 font-mono">{displayMin}–{displayMax}{unit}</strong>
          </span>
        </div>

        {/* Visual progress bar with target range highlight */}
        <div className="relative w-full h-2.5 bg-slate-900/90 rounded-full overflow-hidden border border-slate-700/50">
          {/* Target range marker background */}
          <div
            className="absolute top-0 bottom-0 bg-emerald-500/20 border-x border-emerald-400/40"
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 bg-gradient-to-r from-slate-800/95 to-slate-850/95 rounded-2xl border border-slate-700 shadow-md">
        <div className="flex items-center gap-3.5">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${
              isBalanced
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-emerald-500/10'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-amber-500/10'
            }`}
          >
            {isBalanced ? (
              <CheckCircle2 className="w-6 h-6 animate-pulse" />
            ) : (
              <AlertCircle className="w-6 h-6 animate-bounce" />
            )}
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <span>{isBalanced ? 'Receita Perfeitamente Balanceada' : 'Ajustes Necessários na Fórmula'}</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  isBalanced
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}
              >
                {isBalanced ? 'Equilibrado' : 'Revisar'}
              </span>
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              {isBalanced
                ? 'Todos os parâmetros bromatológicos e térmicos estão perfeitamente calibrados para o estilo.'
                : 'Alguns parâmetros estão fora dos limites ideais de consistência ou dulçor. Veja as barras abaixo.'}
            </p>
          </div>
        </div>

        {/* Temperature Badge */}
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-cyan-950/50 border border-cyan-800/60 text-cyan-200 self-start sm:self-auto shadow-sm">
          <ThermometerSnowflake className="w-6 h-6 text-cyan-400 shrink-0" />
          <div>
            <div className="text-[11px] uppercase font-bold tracking-wider text-cyan-400">
              Temp. Serviço (Vitrine)
            </div>
            <div className="text-xl font-black font-mono text-cyan-100">
              {servingTemperature} °C
            </div>
          </div>
        </div>
      </div>

      {/* Grid of parameters with larger fonts and high contrast */}
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
