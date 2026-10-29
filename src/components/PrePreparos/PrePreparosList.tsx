import React, { useState } from 'react';
import { Preparation } from '../../types/gelato';
import { Search, ChefHat } from 'lucide-react';

interface PrePreparosListProps {
  preparations: Preparation[];
}

export const PrePreparosList: React.FC<PrePreparosListProps> = ({ preparations }) => {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<'Todas' | 'Pré-preparo' | 'Variegato'>('Todas');

  const filtered = preparations.filter(p => {
    const matchCat = catFilter === 'Todas' || p.category === catFilter;
    const matchSearch =
      search === '' ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.ingredients.some(i => i.name.toLowerCase().includes(search.toLowerCase()));
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="bg-slate-800/95 rounded-2xl border border-slate-700/80 p-5 shadow-xl space-y-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
            <ChefHat className="w-6 h-6 text-amber-400" />
            <span>Pré-preparos, Bases & Variegatos Caseiros</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
            {preparations.length} receitas auxiliares com formulação de insumos e procedimentos de cocção.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nome do pré-preparo ou insumo..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-medium"
            />
          </div>

          <div className="flex items-center gap-1.5">
            {(['Todas', 'Pré-preparo', 'Variegato'] as const).map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setCatFilter(cat)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  catFilter === cat
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-slate-900 border border-slate-700 text-slate-300 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid of preparations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((prep, idx) => {
          const totalWeight = prep.ingredients.reduce((a, b) => a + b.grams, 0);

          return (
            <div
              key={idx}
              className="bg-slate-800/80 rounded-2xl border border-slate-700/80 p-5 shadow-lg flex flex-col justify-between hover:border-amber-500/50 transition-colors"
            >
              <div className="space-y-3.5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-base text-white">{prep.name}</h3>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                      prep.category === 'Variegato'
                        ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                        : 'bg-blue-500/15 text-blue-300 border-blue-500/40'
                    }`}
                  >
                    {prep.category}
                  </span>
                </div>

                {/* Ingredients table preview */}
                <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-700/70 space-y-1.5">
                  <span className="text-xs uppercase font-bold text-slate-400 block tracking-wider mb-1">
                    Composição:
                  </span>
                  {prep.ingredients.map((ing, iIdx) => (
                    <div key={iIdx} className="flex justify-between text-xs sm:text-sm text-slate-200">
                      <span>{ing.name}</span>
                      <span className="font-mono text-amber-300 font-bold">{ing.grams} g</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-slate-700 flex justify-between text-xs sm:text-sm font-black text-white">
                    <span>Peso Total:</span>
                    <span className="font-mono text-emerald-400">{Math.round(totalWeight)} g</span>
                  </div>
                </div>

                {/* Instructions */}
                {prep.instructions && (
                  <div className="text-xs sm:text-sm text-slate-300 bg-slate-900/40 p-3 rounded-xl border border-slate-800">
                    <span className="text-xs uppercase font-bold text-amber-400/90 block mb-1">
                      Modo de Preparo:
                    </span>
                    <p className="line-clamp-4 leading-relaxed">{prep.instructions}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
