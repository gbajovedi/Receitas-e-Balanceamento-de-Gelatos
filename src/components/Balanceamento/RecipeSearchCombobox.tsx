import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Recipe } from '../../types/gelato';
import { Search, ChevronDown, Check, Plus, X } from 'lucide-react';

interface RecipeSearchComboboxProps {
  recipes: Recipe[];
  selectedRecipeId: string;
  onSelectRecipe: (id: string) => void;
}

export const RecipeSearchCombobox: React.FC<RecipeSearchComboboxProps> = ({
  recipes,
  selectedRecipeId,
  onSelectRecipe
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Find currently active recipe
  const selectedRecipe = useMemo(() => {
    if (selectedRecipeId === 'new') return null;
    return recipes.find(r => r.id === selectedRecipeId);
  }, [recipes, selectedRecipeId]);

  // Filter recipes based on search
  const filteredRecipes = useMemo(() => {
    if (!searchTerm.trim()) return recipes;
    const term = searchTerm.toLowerCase().trim();
    return recipes.filter(r => {
      const matchName = r.name.toLowerCase().includes(term);
      const matchCategory = r.category?.toLowerCase().includes(term);
      const matchIngs = r.ingredients?.some(i => i.name.toLowerCase().includes(term));
      return matchName || matchCategory || matchIngs;
    });
  }, [recipes, searchTerm]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setSearchTerm('');
    }
  }, [isOpen]);

  const handleSelect = (id: string) => {
    onSelectRecipe(id);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative min-w-[280px] sm:min-w-[340px]">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-slate-900 border ${
          isOpen ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-slate-700 hover:border-slate-600'
        } rounded-xl px-4 py-2.5 flex items-center justify-between text-left transition-all shadow-inner group`}
      >
        <div className="flex items-center gap-2 min-w-0 pr-2">
          <Search className="w-4 h-4 text-amber-400 shrink-0 group-hover:scale-110 transition-transform" />
          <div className="truncate">
            {selectedRecipeId === 'new' ? (
              <span className="text-sm font-bold text-amber-300">
                ✨ Nova Receita Personalizada
              </span>
            ) : selectedRecipe ? (
              <div className="flex items-center gap-2 truncate" title={selectedRecipe.name}>
                <span className="text-sm font-bold text-white truncate">
                  {selectedRecipe.name}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 whitespace-nowrap shrink-0">
                  {selectedRecipe.category}
                </span>
              </div>
            ) : (
              <span className="text-sm font-medium text-slate-400">
                Buscar ou escolher sabor...
              </span>
            )}
          </div>
        </div>

        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-amber-400' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-full sm:w-[420px] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[440px] animate-in fade-in zoom-in-95 duration-150">
          {/* Search Input Field */}
          <div className="p-3 border-b border-slate-800 bg-slate-900/95 sticky top-0 z-10 space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 text-amber-400 absolute left-3 top-3" />
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Digite o sabor (ex: coco, pistache, chocolate, zero)..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-8 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-medium"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-2.5 p-0.5 text-slate-400 hover:text-white rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
              <span>{filteredRecipes.length} receitas encontradas</span>
              <span>Pressione para carregar</span>
            </div>
          </div>

          {/* List Options */}
          <div className="overflow-y-auto divide-y divide-slate-800/60 p-1.5 space-y-1">
            {/* Create New Recipe Option */}
            <button
              type="button"
              onClick={() => handleSelect('new')}
              className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between ${
                selectedRecipeId === 'new'
                  ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                  : 'hover:bg-slate-800/80 text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-bold text-amber-300">
                    Criar Nova Receita Personalizada
                  </div>
                  <div className="text-xs text-slate-400">
                    Comece do zero com ingredientes em branco
                  </div>
                </div>
              </div>
              {selectedRecipeId === 'new' && (
                <Check className="w-4 h-4 text-amber-400 shrink-0" />
              )}
            </button>

            {/* Filtered Recipes */}
            {filteredRecipes.map(r => {
              const isSelected = r.id === selectedRecipeId;
              const ingsPreview = r.ingredients
                ? r.ingredients.slice(0, 3).map(i => i.name).join(', ')
                : '';

              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => handleSelect(r.id)}
                  className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between group ${
                    isSelected
                      ? 'bg-amber-500/20 border border-amber-500/40 text-amber-200'
                      : 'hover:bg-slate-800/80 text-slate-200'
                  }`}
                >
                  <div className="min-w-0 pr-2 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className="text-sm font-bold text-white group-hover:text-amber-200 transition-colors break-words leading-snug"
                        title={r.name}
                      >
                        {r.name}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 whitespace-nowrap shrink-0 mt-0.5">
                        {r.category}
                      </span>
                    </div>
                    {ingsPreview && (
                      <div className="text-xs text-slate-400 truncate mt-0.5">
                        {ingsPreview}...
                      </div>
                    )}
                  </div>

                  {isSelected && (
                    <Check className="w-4 h-4 text-amber-400 shrink-0 ml-2" />
                  )}
                </button>
              );
            })}

            {filteredRecipes.length === 0 && (
              <div className="text-center py-8 text-xs text-slate-400 space-y-1">
                <div>Nenhuma receita encontrada para "{searchTerm}".</div>
                <div className="text-slate-500">Tente buscar por outro termo ou ingrediente.</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

