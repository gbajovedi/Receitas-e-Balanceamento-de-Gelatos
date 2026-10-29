import React from 'react';

interface AllergensBadgeProps {
  allergensLabel: string;
}

export const AllergensBadge: React.FC<AllergensBadgeProps> = ({ allergensLabel }) => {
  return (
    <div className="p-3.5 bg-slate-800/50 rounded-xl border border-slate-700/60 text-xs">
      <div className="flex items-center gap-2 mb-1 text-slate-300 font-semibold">
        <span className="text-amber-400">⚠️</span>
        <span>Rótulo Regulamentar de Alérgenos (Calculado Automaticamente):</span>
      </div>
      <p className="text-slate-300 font-mono tracking-tight bg-slate-900/60 p-2 rounded border border-slate-800">
        {allergensLabel}
      </p>
    </div>
  );
};
