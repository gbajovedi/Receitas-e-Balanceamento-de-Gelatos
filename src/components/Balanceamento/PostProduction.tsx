import React from 'react';
import { VariegatoItem, Ingredient } from '../../types/gelato';
import { Plus, Trash2 } from 'lucide-react';

interface PostProductionProps {
  variegatos: VariegatoItem[];
  availableIngredients: Ingredient[];
  onUpdateVariegatos: (variegatos: VariegatoItem[]) => void;
}

export const PostProduction: React.FC<PostProductionProps> = ({
  variegatos,
  availableIngredients,
  onUpdateVariegatos
}) => {
  const handleAdd = () => {
    onUpdateVariegatos([...variegatos, { name: '', grams: 100, costKg: 0 }]);
  };

  const handleRemove = (index: number) => {
    const next = [...variegatos];
    next.splice(index, 1);
    onUpdateVariegatos(next);
  };

  const handleChangeName = (index: number, name: string) => {
    const next = [...variegatos];
    const ing = availableIngredients.find(i => i.name.toLowerCase() === name.toLowerCase());
    next[index] = {
      ...next[index],
      name,
      costKg: ing ? ing.costKg : next[index].costKg
    };
    onUpdateVariegatos(next);
  };

  const handleChangeGrams = (index: number, grams: number) => {
    const next = [...variegatos];
    next[index] = { ...next[index], grams: Math.max(0, grams) };
    onUpdateVariegatos(next);
  };

  const variegatoCandidates = availableIngredients.filter(i =>
    /(variegato|brigadeiro|nutella|caramelo|cocada|goiabada|doce de leite|biscoff|croissant|pudim|torrone|paçoca|pasta|calda|amendoim|castanha|avelã|pistache|nozes|amêndoa|biscoito|cereja)/i.test(
      i.name
    )
  );

  return (
    <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-white flex items-center gap-2">
            <span>🍯</span>
            <span>Pós-Produção (Variegatos, Mesclas & Inclusões)</span>
          </h4>
          <p className="text-xs text-slate-400">
            Insumos adicionados após o congelamento/batimento na calda base.
          </p>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-medium transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Adicionar Mescla</span>
        </button>
      </div>

      {variegatos.length === 0 ? (
        <div className="text-center py-4 border border-dashed border-slate-700 rounded-lg text-xs text-slate-500">
          Nenhuma mescla ou variegato adicionado. A calda base corresponde a 100% do gelato final.
        </div>
      ) : (
        <div className="space-y-2">
          {variegatos.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 bg-slate-900/80 p-2 rounded-lg border border-slate-700/80"
            >
              <div className="flex-1">
                <input
                  type="text"
                  list="variegatos-options"
                  placeholder="Nome do variegato ou recheio..."
                  value={item.name}
                  onChange={e => handleChangeName(idx, e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="w-28 flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  step="5"
                  value={item.grams || ''}
                  onChange={e => handleChangeGrams(idx, parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-right text-white font-mono focus:outline-none focus:border-amber-500"
                />
                <span className="text-[11px] text-slate-400">g</span>
              </div>

              <div className="w-24 text-right pr-2">
                <span className="text-xs font-mono text-slate-300">
                  R$ {(item.costKg ?? 0).toFixed(2)}
                </span>
                <span className="text-[10px] block text-slate-500">/kg</span>
              </div>

              <button
                type="button"
                onClick={() => handleRemove(idx)}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                title="Remover"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <datalist id="variegatos-options">
        {variegatoCandidates.map(i => (
          <option key={i.id} value={i.name}>
            R$ {i.costKg.toFixed(2)}/kg
          </option>
        ))}
      </datalist>
    </div>
  );
};

