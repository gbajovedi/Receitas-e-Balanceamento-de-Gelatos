import React, { useState } from 'react';
import { Preparation, Ingredient } from '../../types/gelato';
import { db } from '../../db/database';
import { Search, ChefHat, X, Plus, Edit2, Trash2, Save, Sparkles, Utensils, AlertCircle } from 'lucide-react';

interface PrePreparosListProps {
  preparations: Preparation[];
  availableIngredients?: Ingredient[];
  onRefresh?: () => void;
}

interface PreparationFormItem {
  name: string;
  grams: number | '';
}

export const PrePreparosList: React.FC<PrePreparosListProps> = ({
  preparations,
  availableIngredients = [],
  onRefresh,
}) => {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<'Todas' | 'Pré-preparo' | 'Variegato'>('Todas');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPrep, setEditingPrep] = useState<Preparation | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'Pré-preparo' | 'Variegato'>('Pré-preparo');
  const [instructions, setInstructions] = useState('');
  const [items, setItems] = useState<PreparationFormItem[]>([
    { name: '', grams: '' },
  ]);

  const filtered = preparations.filter(p => {
    const matchCat = catFilter === 'Todas' || p.category === catFilter;
    const matchSearch =
      search === '' ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.ingredients.some(i => i.name.toLowerCase().includes(search.toLowerCase()));
    return matchCat && matchSearch;
  });

  const handleOpenCreate = () => {
    setEditingPrep(null);
    setName('');
    setCategory('Pré-preparo');
    setInstructions('');
    setItems([
      { name: '', grams: '' },
      { name: '', grams: '' },
    ]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (prep: Preparation) => {
    setEditingPrep(prep);
    setName(prep.name);
    setCategory(prep.category);
    setInstructions(prep.instructions || '');
    setItems(
      prep.ingredients.length > 0
        ? prep.ingredients.map(i => ({ name: i.name, grams: i.grams }))
        : [{ name: '', grams: '' }]
    );
    setIsModalOpen(true);
  };

  const handleDelete = async (prep: Preparation) => {
    if (window.confirm(`Deseja realmente excluir o ${prep.category.toLowerCase()} "${prep.name}"?`)) {
      await db.preparations.delete(prep.id);
      if (onRefresh) onRefresh();
    }
  };

  const handleAddItem = () => {
    setItems(prev => [...prev, { name: '', grams: '' }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: 'name' | 'grams', value: string | number) => {
    setItems(prev =>
      prev.map((item, i) => {
        if (i !== index) return item;
        return {
          ...item,
          [field]: field === 'grams' ? (value === '' ? '' : Math.max(0, Number(value))) : value,
        };
      })
    );
  };

  const totalModalGrams = items.reduce((acc, curr) => acc + (typeof curr.grams === 'number' ? curr.grams : 0), 0);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const validIngredients = items
      .filter(item => item.name.trim() !== '' && typeof item.grams === 'number' && item.grams > 0)
      .map(item => ({
        name: item.name.trim(),
        grams: Number(item.grams),
      }));

    if (validIngredients.length === 0) {
      alert('Adicione pelo menos um ingrediente com peso maior que zero.');
      return;
    }

    const prepId = editingPrep ? editingPrep.id : `prep_${Date.now()}`;

    const prepToSave: Preparation = {
      id: prepId,
      name: name.trim(),
      category,
      instructions: instructions.trim(),
      ingredients: validIngredients,
      isCustom: editingPrep ? editingPrep.isCustom : true,
    };

    await db.preparations.put(prepToSave);
    setIsModalOpen(false);
    setEditingPrep(null);
    if (onRefresh) onRefresh();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="bg-slate-800/95 rounded-2xl border border-slate-700/80 p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
              <ChefHat className="w-6 h-6 text-amber-400" />
              <span>Pré-preparos, Bases & Variegatos Caseiros</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
              {preparations.length} receitas auxiliares com formulação de insumos e procedimentos de cocção.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 shrink-0 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Pré-preparo / Variegato</span>
          </button>
        </div>

        <div className="space-y-3">
          <div className="relative w-full">
            <Search className="w-5 h-5 text-amber-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nome do pré-preparo ou insumo..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-11 pr-10 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-semibold shadow-inner"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-3 p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
                title="Limpar busca"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
            {(['Todas', 'Pré-preparo', 'Variegato'] as const).map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setCatFilter(cat)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap shrink-0 transition-all ${
                  catFilter === cat
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

      {/* Grid of preparations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(prep => {
          const totalWeight = prep.ingredients.reduce((a, b) => a + b.grams, 0);

          return (
            <div
              key={prep.id}
              className="bg-slate-800/80 rounded-2xl border border-slate-700/80 p-5 shadow-lg flex flex-col justify-between hover:border-amber-500/50 transition-colors group"
            >
              <div className="space-y-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-base text-white flex items-center gap-2 flex-wrap">
                      <span>{prep.name}</span>
                      {prep.isCustom && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                          Custom
                        </span>
                      )}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                        prep.category === 'Variegato'
                          ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                          : 'bg-blue-500/15 text-blue-300 border-blue-500/40'
                      }`}
                    >
                      {prep.category}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(prep)}
                      className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-amber-500/15 rounded-lg transition-all"
                      title={`Editar "${prep.name}"`}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(prep)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 rounded-lg transition-all"
                      title={`Excluir "${prep.name}"`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
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
                    <p className="line-clamp-4 leading-relaxed whitespace-pre-line">{prep.instructions}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Cadastrar / Editar Pré-preparo ou Variegato */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700/90 rounded-3xl w-full max-w-xl sm:max-w-2xl p-5 sm:p-7 shadow-2xl space-y-5 my-6 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-xl shadow-lg shadow-amber-500/20 shrink-0">
                  👨‍🍳
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                    <span>
                      {editingPrep
                        ? `Editar ${editingPrep.category}: ${editingPrep.name}`
                        : 'Cadastrar Pré-preparo / Variegato'}
                    </span>
                    <Sparkles className="w-4 h-4 text-amber-400" />
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Defina a formulação em gramas e as orientações de cocção e armazenamento.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingPrep(null);
                }}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors shrink-0"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Nome e Categoria */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1.5">
                    Nome da Preparação / Receita:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ex: Calda de Frutas Vermelhas, Geleia de Morango..."
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 font-medium focus:border-amber-500 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1.5">
                    Tipo / Classificação:
                  </label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as 'Pré-preparo' | 'Variegato')}
                    className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-medium focus:border-amber-500 focus:outline-none transition-colors"
                  >
                    <option value="Pré-preparo">Pré-preparo (Base de Calda, Calda Mestre, Pasta)</option>
                    <option value="Variegato">Variegato (Recheio / Mescla de Cuba)</option>
                  </select>
                </div>
              </div>

              {/* Datalist de Insumos Registrados */}
              <datalist id="registered-ingredients-list">
                {availableIngredients.map(ing => (
                  <option key={ing.id} value={ing.name} />
                ))}
              </datalist>

              {/* Formulação de Insumos */}
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-700/80 space-y-3 shadow-inner">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Utensils className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-black uppercase text-white tracking-wider">
                      Ingredientes da Receita
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-lg">
                    Total: {Math.round(totalModalGrams)} g
                  </span>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="flex-1">
                        <input
                          type="text"
                          required
                          list="registered-ingredients-list"
                          placeholder="Nome do ingrediente..."
                          value={item.name}
                          onChange={e => handleItemChange(idx, 'name', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white font-medium focus:border-amber-500 focus:outline-none transition-colors"
                        />
                      </div>
                      <div className="w-28 sm:w-32 relative">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          required
                          placeholder="Peso"
                          value={item.grams === '' ? '' : item.grams}
                          onChange={e => handleItemChange(idx, 'grams', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-3 pr-8 py-2 text-xs sm:text-sm text-white font-mono font-bold focus:border-amber-500 focus:outline-none transition-colors"
                        />
                        <span className="absolute right-2.5 top-2 text-xs font-mono font-bold text-slate-400">
                          g
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        disabled={items.length === 1}
                        className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                        title="Remover linha"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleAddItem}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-750 border border-dashed border-slate-600 rounded-xl text-xs font-bold text-amber-300 hover:text-amber-200 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar Mais um Ingrediente</span>
                </button>
              </div>

              {/* Modo de Preparo */}
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1.5">
                  Procedimento de Preparo & Orientações Técnicas:
                </label>
                <textarea
                  rows={4}
                  placeholder="Ex: Aquecer a água e a polpa a 45°C. Adicionar os açúcares previamente misturados com a pectina. Levar a fervura por 2 minutos..."
                  value={instructions}
                  onChange={e => setInstructions(e.target.value)}
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none transition-colors leading-relaxed"
                />
              </div>

              {/* Rodapé do Modal */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingPrep(null);
                  }}
                  className="px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>Salvar {category}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
