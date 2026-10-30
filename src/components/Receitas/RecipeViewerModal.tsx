import React, { useState, useEffect, useMemo } from 'react';
import { Recipe } from '../../types/gelato';
import {
  X,
  Scale,
  Calculator,
  Printer,
  CheckCircle2,
  Circle,
  RotateCcw,
  Layers,
  ChefHat
} from 'lucide-react';

interface RecipeViewerModalProps {
  recipe: Recipe | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenInCalculator: (id: string) => void;
}

export const RecipeViewerModal: React.FC<RecipeViewerModalProps> = ({
  recipe,
  isOpen,
  onClose,
  onOpenInCalculator
}) => {
  if (!isOpen || !recipe) return null;

  const baseWeight = useMemo(() => {
    if (!recipe.ingredients || recipe.ingredients.length === 0) return 1000;
    return recipe.ingredients.reduce((acc, item) => acc + item.grams, 0);
  }, [recipe]);

  const [targetBatchGrams, setTargetBatchGrams] = useState<number>(Math.round(baseWeight));
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  // Reset batch and checklist whenever a new recipe is opened
  useEffect(() => {
    setTargetBatchGrams(Math.round(baseWeight));
    setCheckedItems({});
  }, [recipe, baseWeight]);

  // Ratio to scale ingredients
  const scaleRatio = baseWeight > 0 ? targetBatchGrams / baseWeight : 1;

  // Toggle checklist for kitchen weighing
  const toggleCheck = (name: string) => {
    setCheckedItems(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  const handleResetChecklist = () => {
    setCheckedItems({});
  };

  // Quick preset sizes
  const presets = [1000, 2000, 2500, 3000, 4000, 5000];

  return (
    <div className="print-modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in p-0 sm:p-4">
      {/* Full screen on mobile (w-full h-full), elegant rounded modal on desktop */}
      <div className="print-recipe-card bg-slate-900 border border-slate-700/80 w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Sticky Header */}
        <div className="p-4 sm:p-5 bg-slate-850 border-b border-slate-700/80 flex items-start justify-between gap-3 shrink-0">
          <div className="space-y-1 min-w-0 pr-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/40 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <ChefHat className="w-3.5 h-3.5" />
                Ficha de Produção • Modo Cozinha
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-semibold">
                {recipe.category}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight truncate">
              {recipe.name}
            </h2>
            <p className="no-print text-xs text-slate-400">
              Modo somente leitura para pesagem e produção. Ajuste a batelada abaixo.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="no-print p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors shrink-0"
            title="Fechar Visualizador"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="print-recipe-body flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Batch Scaling Control Bar */}
          <div className="bg-slate-800/90 p-4 rounded-2xl border border-slate-700 space-y-3 shadow-md">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-amber-400" />
                <span>Peso Desejado da Batelada:</span>
              </span>
              <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1">
                <input
                  type="number"
                  min="100"
                  step="50"
                  value={targetBatchGrams || ''}
                  onChange={e => setTargetBatchGrams(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-24 bg-transparent text-right text-base font-black font-mono text-amber-300 focus:outline-none"
                />
                <span className="text-xs font-mono font-bold text-slate-400">g</span>
              </div>
            </div>

            {/* Quick scale preset buttons */}
            <div className="no-print flex items-center gap-1.5 overflow-x-auto pb-0.5">
              <span className="text-[11px] text-slate-400 font-semibold uppercase pr-1 shrink-0">
                Atalhos:
              </span>
              {presets.map(grams => (
                <button
                  key={grams}
                  type="button"
                  onClick={() => setTargetBatchGrams(grams)}
                  className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all shrink-0 ${
                    targetBatchGrams === grams
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'bg-slate-900 hover:bg-slate-750 text-slate-300 border border-slate-700'
                  }`}
                >
                  {grams >= 1000 ? `${grams / 1000} kg` : `${grams} g`}
                </button>
              ))}
            </div>
          </div>

          {/* Ingredients Checklist Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <span>Ingredientes a Pesar ({recipe.ingredients?.length ?? 0}):</span>
              </h3>

              <button
                type="button"
                onClick={handleResetChecklist}
                className="no-print text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                title="Desmarcar todos"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Desmarcar todos</span>
              </button>
            </div>

            <div className="bg-slate-800/70 rounded-2xl border border-slate-700/80 divide-y divide-slate-700/50 overflow-hidden shadow-lg">
              {recipe.ingredients &&
                recipe.ingredients.map((item, idx) => {
                  const scaledGrams = Math.round(item.grams * scaleRatio * 10) / 10;
                  const pct = baseWeight > 0 ? (item.grams / baseWeight) * 100 : 0;
                  const isChecked = !!checkedItems[item.name];

                  return (
                    <div
                      key={idx}
                      onClick={() => toggleCheck(item.name)}
                      className={`p-3.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer select-none transition-colors ${
                        isChecked
                          ? 'bg-emerald-950/20 text-slate-500'
                          : 'hover:bg-slate-750/50 text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                            isChecked
                              ? 'text-emerald-400 bg-emerald-500/20 border border-emerald-500/40'
                              : 'text-slate-500 hover:text-slate-400 border border-slate-600'
                          }`}
                        >
                          {isChecked ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : (
                            <Circle className="w-4 h-4" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <span
                            className={`text-sm sm:text-base font-bold block truncate ${
                              isChecked ? 'line-through text-slate-500' : 'text-white'
                            }`}
                          >
                            {item.name}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">
                            {pct.toFixed(1)}% da calda
                          </span>
                        </div>
                      </div>

                      {/* Prominent Scale Weight */}
                      <div className="text-right shrink-0">
                        <div
                          className={`text-lg sm:text-2xl font-black font-mono tracking-tight ${
                            isChecked ? 'line-through text-slate-500' : 'text-amber-300'
                          }`}
                        >
                          {scaledGrams}
                          <span className="text-xs sm:text-sm font-bold text-slate-400 ml-1">
                            g
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Variegatos / Inclusions (if any) */}
          {recipe.variegatos && recipe.variegatos.length > 0 && (
            <div className="bg-amber-500/10 p-4 rounded-2xl border border-amber-500/30 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300 block">
                🍯 Mesclas & Variegatos Pós-Calda:
              </span>
              <div className="space-y-1.5">
                {recipe.variegatos.map((v, i) => {
                  const scaledVarGrams = Math.round(v.grams * scaleRatio * 10) / 10;
                  return (
                    <div
                      key={i}
                      className="flex justify-between items-center text-sm font-semibold text-amber-200 bg-slate-900/60 p-2.5 rounded-xl border border-amber-500/20"
                    >
                      <span>{v.name}</span>
                      <span className="font-mono font-black text-amber-300 text-base">
                        {scaledVarGrams} g
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Notes (if any) */}
          {recipe.notes && (
            <div className="p-3.5 bg-slate-800/50 rounded-xl border border-slate-700 text-xs text-slate-300 space-y-1">
              <span className="font-bold text-slate-400 uppercase tracking-wider block">
                Observações do Chef:
              </span>
              <p className="leading-relaxed">{recipe.notes}</p>
            </div>
          )}
        </div>

        {/* Sticky Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-850 border-t border-slate-700/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs sm:text-sm text-slate-300 font-mono font-bold">
            Total Batelada:{' '}
            <strong className="text-emerald-400 text-base sm:text-lg">
              {targetBatchGrams} g
            </strong>
          </div>

          <div className="no-print flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:text-white text-xs sm:text-sm font-bold transition-colors flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Imprimir</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenInCalculator(recipe.id);
              }}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-amber-500/25 transition-all flex items-center gap-2 active:scale-95"
            >
              <Calculator className="w-4 h-4" />
              <span>Abrir na Calculadora</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
