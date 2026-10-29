import React from 'react';
import { BatchAnalysis, NutrientValidation } from '../../types/gelato';

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

    let badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    let barColor = 'bg-emerald-500';

    if (status === 'Baixo') {
      badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      barColor = 'bg-amber-500';
    } else if (status === 'Alto') {
      badgeColor = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      barColor = 'bg-rose-500';
    }

    // Relative progress within a safe range (0 to max * 1.3)
    const upperLimit = max > 0 ? max * 1.3 : 1;
    const progressPct = Math.min(Math.max((val / upperLimit) * 100, 0), 100);
    const minMarkerPct = (min / upperLimit) * 100;
    const maxMarkerPct = (max / upperLimit) * 100;

    return (
      <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/60 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-slate-300">{label}</span>
          <span className={`text-[11px] px-2 py-0.5 rounded-full border font-semibold ${badgeColor}`}>
            {status}
          </span>
        </div>

        <div className="flex items-baseline justify-between mb-1.5">
          <span className="text-lg font-bold text-white tracking-tight">
            {displayVal}{unit}
          </span>
          <span className="text-[10px] text-slate-400">
            Alvo: {displayMin} - {displayMax}{unit}
          </span>
        </div>

        {/* Visual progress bar with target range highlight */}
        <div className="relative w-full h-2 bg-slate-900 rounded-full overflow-hidden">
          {/* Target range marker background */}
          <div
            className="absolute top-0 bottom-0 bg-slate-700/50"
            style={{ left: `${minMarkerPct}%`, width: `${Math.max(maxMarkerPct - minMarkerPct, 2)}%` }}
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
      {/* Header status */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-800/90 rounded-xl border border-slate-700 shadow-sm">
        <div className="flex items-center gap-3">
          <div
            className={`w-3.5 h-3.5 rounded-full animate-pulse ${
              isBalanced ? 'bg-emerald-400 shadow-lg shadow-emerald-400/50' : 'bg-amber-400 shadow-lg shadow-amber-400/50'
            }`}
          />
          <div>
            <h3 className="text-sm font-semibold text-white">
              {isBalanced ? 'Receita Perfeitamente Balanceada' : 'Ajustes Necessários na Fórmula'}
            </h3>
            <p className="text-xs text-slate-400">
              {isBalanced
                ? 'Todos os parâmetros bromatológicos estão dentro da faixa ideal do estilo.'
                : 'Alguns parâmetros estão fora dos limites ideais de degustação e ponto de vitrine.'}
            </p>
          </div>
        </div>

        {/* Temperature Badge */}
        <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-lg bg-cyan-950/40 border border-cyan-800/50 text-cyan-300">
          <span className="text-lg">❄️</span>
          <div>
            <div className="text-[10px] uppercase font-bold text-cyan-400/80 tracking-wider">Temperatura de Serviço</div>
            <div className="text-sm font-extrabold">{servingTemperature} °C</div>
          </div>
        </div>
      </div>

      {/* Grid of parameters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
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
