import React, { useState, useMemo } from 'react';
import { Recipe } from '../../types/gelato';
import { Search, Calculator, Plus, Trash2, BookOpen, Eye } from 'lucide-react';
import { db } from '../../db/database';
import { RecipeViewerModal } from './RecipeViewerModal';

interface RecipeListProps {
  recipes: Recipe[];
  onSelectRecipe: (id: string) => void;
  onRefresh: () => void;
}

export const RecipeList: React.FC<RecipeListProps> = ({ recipes, onSelectRecipe, onRefresh }) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [viewingRecipe, setViewingRecipe] = useState<Recipe | null>(null);

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
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header & Search */}
      <div className="bg-slate-800/95 rounded-2xl border border-slate-700/80 p-5 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
              <BookOpen className="w-6 h-6 text-amber-400" />
              <span>Catálogo & Livro de Receitas</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
              Toque em qualquer receita para abrir a <strong>Ficha de Produção (Modo Cozinha)</strong> com ajuste de batelada.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onSelectRecipe('new')}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-amber-500/25 transition-all flex items-center gap-2 self-start md:self-auto active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Criar Nova Receita</span>
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por sabor ou insumo (ex: pistache, chocolate, maracujá, manga)..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-medium"
            />
          </div>

          {/* Category filter pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            {categories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
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
              className="bg-slate-800/80 hover:bg-slate-800 rounded-2xl border border-slate-700/80 p-5 shadow-lg hover:border-amber-500/50 transition-all flex flex-col justify-between group hover:shadow-amber-500/5 cursor-pointer"
              onClick={() => setViewingRecipe(recipe)}
            >
              <div className="space-y-3.5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-base text-white group-hover:text-amber-200 transition-colors line-clamp-1">
                    {recipe.name}
                  </h3>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-900 text-slate-300 border border-slate-700 whitespace-nowrap">
                    {recipe.category}
                  </span>
                </div>

                {recipe.isCustom && (
                  <span className="inline-block text-xs px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold">
                    ✨ Receita Personalizada
                  </span>
                )}

                {/* Ingredients snippet */}
                <div className="space-y-1">
                  <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                    Insumos ({recipe.ingredients?.length ?? 0}):
                  </span>
                  <div className="text-xs sm:text-sm text-slate-300 line-clamp-2 leading-relaxed">
                    {recipe.ingredients && recipe.ingredients.map(i => i.name).join(', ')}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs sm:text-sm text-slate-400 font-mono pt-3 border-t border-slate-700/60 font-medium">
                  <span>Peso base: <strong className="text-slate-200">{Math.round(totalWeight)} g</strong></span>
                  <span className="text-amber-400/90 font-bold group-hover:underline flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    Examinar receita
                  </span>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div
                className="flex items-center gap-2 pt-4 mt-3 border-t border-slate-700/60"
                onClick={e => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => setViewingRecipe(recipe)}
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-750 text-slate-200 hover:text-white border border-slate-700 font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-1.5"
                >
                  <Eye className="w-4 h-4 text-amber-400" />
                  <span>Ver Ficha</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectRecipe(recipe.id)}
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/10 active:scale-95"
                  title="Carregar esta receita na calculadora de balanceamento"
                >
                  <Calculator className="w-4 h-4" />
                  <span>Balancear</span>
                </button>

                {recipe.isCustom && (
                  <button
                    type="button"
                    onClick={() => handleDeleteCustom(recipe.id, recipe.name)}
                    className="p-2.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 rounded-xl transition-colors border border-slate-700"
                    title="Excluir receita personalizada"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredRecipes.length === 0 && (
        <div className="text-center py-16 bg-slate-800/40 rounded-2xl border-2 border-dashed border-slate-700 text-slate-400 text-sm font-medium">
          Nenhuma receita encontrada para os filtros selecionados.
        </div>
      )}

      {/* Full-Screen Kitchen Mode Viewer Modal */}
      <RecipeViewerModal
        recipe={viewingRecipe}
        isOpen={!!viewingRecipe}
        onClose={() => setViewingRecipe(null)}
        onOpenInCalculator={onSelectRecipe}
      />
    </div>
  );
};
