import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface AllergensBadgeProps {
  allergensLabel: string;
}

export const AllergensBadge: React.FC<AllergensBadgeProps> = ({ allergensLabel }) => {
  return (
    <div className="p-4 bg-slate-800/90 rounded-2xl border border-slate-700/80 shadow-md space-y-2">
      <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase tracking-wider">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
        <span>Rótulo Regulamentar de Alérgenos (Anvisa / Normas Oficiais):</span>
      </div>
      <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-700 font-mono text-xs sm:text-sm text-slate-200 tracking-wide font-semibold leading-relaxed">
        {allergensLabel}
      </div>
    </div>
  );
};
