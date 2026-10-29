import React, { useState, useMemo } from 'react';
import { Recipe } from '../../types/gelato';
import { Search, Calculator, Plus, Trash2 } from 'lucide-react';
import { db } from '../../db/database';

interface RecipeListProps {
  recipes: Recipe[];
  onSelectRecipe: (id: string) => void;
  onRefresh: () => void;
}

export const RecipeList: React.FC<RecipeListProps> = ({ recipes, onSelectRecipe, onRefresh }) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const r of recipes) {
      if (r.category) set.add(r.category);
    }
    return ['Todas', ...Array.from(set)];
  }, [recipes]);

  const filteredRecipes = useMemo(() => {
    return recipes.filter(r => {
      const matchCat = selectedCategory === 'Todas' || r.category === selectedCategory;
      const matchSearch =
        search === '' ||
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        (r.ingredients && r.ingredients.some(i => i.name.toLowerCase().includes(search.toLowerCase())));
      return matchCat && matchSearch;
    });
  }, [recipes, search, selectedCategory]);

  const handleDeleteCustom = async (id: string, name: string) => {
    if (confirm(`Deseja realmente excluir a receita "${name}"?`)) {
      await db.recipes.delete(id);
      onRefresh();
    }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-16">
      {/* Header & Search */}
      <div className="bg-slate-800/90 rounded-2xl border border-slate-700 p-5 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>📖</span>
              <span>Catálogo & Livro de Receitas</span>
            </h2>
            <p className="text-xs text-slate-400">
              {recipes.length} formulações cadastradas da alta gelateria artesanal.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onSelectRecipe('new')}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/25 transition-all flex items-center gap-1.5 self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Criar Nova Receita</span>
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nome da receita ou ingrediente (ex: pistache, cacau, maracujá)..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Category filter pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            {categories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid of recipe cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRecipes.map(recipe => {
          const totalWeight = recipe.ingredients
            ? recipe.ingredients.reduce((a, b) => a + b.grams, 0)
            : 0;

          return (
            <div
              key={recipe.id}
              className="bg-slate-800/80 hover:bg-slate-800 rounded-2xl border border-slate-700/80 p-4 shadow-lg hover:border-amber-500/40 transition-all flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-sm text-white group-hover:text-amber-200 transition-colors line-clamp-1">
                    {recipe.name}
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 text-slate-300 border border-slate-700 whitespace-nowrap">
                    {recipe.category}
                  </span>
                </div>

                {recipe.isCustom && (
                  <span className="inline-block text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 font-medium">
                    ✨ Receita Personalizada
                  </span>
                )}

                {/* Ingredients snippet */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Insumos Principais:
                  </span>
                  <div className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                    {recipe.ingredients && recipe.ingredients.map(i => i.name).join(', ')}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 font-mono pt-2 border-t border-slate-700/60">
                  <span>Peso base: {Math.round(totalWeight)} g</span>
                  <span>{recipe.ingredients ? recipe.ingredients.length : 0} insumos</span>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="flex items-center gap-2 pt-4 mt-3 border-t border-slate-700/60">
                <button
                  type="button"
                  onClick={() => onSelectRecipe(recipe.id)}
                  className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/10"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>Carregar na Calculadora</span>
                </button>

                {recipe.isCustom && (
                  <button
                    type="button"
                    onClick={() => handleDeleteCustom(recipe.id, recipe.name)}
                    className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors border border-slate-700"
                    title="Excluir receita personalizada"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredRecipes.length === 0 && (
        <div className="text-center py-12 bg-slate-800/40 rounded-2xl border border-dashed border-slate-700 text-slate-400 text-sm">
          Nenhuma receita encontrada para os filtros selecionados.
        </div>
      )}
    </div>
  );
};
