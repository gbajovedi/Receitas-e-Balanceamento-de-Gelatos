import React, { useState, useMemo } from 'react';
import { Ingredient } from '../../types/gelato';
import { db } from '../../db/database';
import { Search, Plus, Save, Edit2, Utensils } from 'lucide-react';

interface IngredientManagerProps {
  ingredients: Ingredient[];
  onRefresh: () => void;
}

export const IngredientManager: React.FC<IngredientManagerProps> = ({ ingredients, onRefresh }) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todas');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingCost, setEditingCost] = useState<number>(0);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New ingredient form state
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Outros');
  const [newCostKg, setNewCostKg] = useState<number>(0);
  const [newSugars, setNewSugars] = useState<number>(0);
  const [newFat, setNewFat] = useState<number>(0);
  const [newMsnf, setNewMsnf] = useState<number>(0);
  const [newOtherSolids, setNewOtherSolids] = useState<number>(0);
  const [newWater] = useState<number>(0);
  const [newPod, setNewPod] = useState<number>(0);
  const [newPac, setNewPac] = useState<number>(0);
  const [newProtein] = useState<number>(0);
  const [newHasAllergen, setNewHasAllergen] = useState<boolean>(false);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const i of ingredients) {
      if (i.category) set.add(i.category);
    }
    return ['Todas', ...Array.from(set)];
  }, [ingredients]);

  const filtered = useMemo(() => {
    return ingredients.filter(i => {
      const matchCat = categoryFilter === 'Todas' || i.category === categoryFilter;
      const matchSearch =
        search === '' || i.name.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [ingredients, search, categoryFilter]);

  const handleStartEditCost = (ing: Ingredient) => {
    setEditingId(ing.id);
    setEditingCost(ing.costKg);
  };

  const handleSaveCost = async (ing: Ingredient) => {
    await db.ingredients.update(ing.id, { costKg: editingCost });
    setEditingId(null);
    onRefresh();
  };

  const handleCreateIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const totalSolids = (newSugars + newFat + newMsnf + newOtherSolids) / 100;

    const newIng: Ingredient = {
      id: `ing_custom_${Date.now()}`,
      name: newName.trim(),
      category: newCategory,
      costKg: newCostKg,
      sugars: newSugars / 100,
      fat: newFat / 100,
      msnf: newMsnf / 100,
      otherSolids: newOtherSolids / 100,
      totalSolids,
      water: newWater > 0 ? newWater / 100 : Math.max(0, 1 - totalSolids),
      pod: newPod,
      pac: newPac,
      protein: newProtein / 100,
      hasAllergen: newHasAllergen,
      isCustom: true
    };

    await db.ingredients.put(newIng);
    setIsAddModalOpen(false);
    setNewName('');
    setNewCostKg(0);
    onRefresh();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header Card */}
      <div className="bg-slate-800/95 rounded-2xl border border-slate-700/80 p-5 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
              <Utensils className="w-6 h-6 text-amber-400" />
              <span>Tabela de Insumos & Matérias-Primas</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
              {ingredients.length} insumos com fatores bromatológicos de PAC, POD, composição e custos/kg.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-amber-500/25 transition-all flex items-center gap-2 self-start md:self-auto active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Novo Insumo</span>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nome do insumo (ex: leite, cacau, açúcar, pistache)..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-medium"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            {categories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  categoryFilter === cat
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

      {/* Table of Ingredients */}
      <div className="bg-slate-800/90 rounded-2xl border border-slate-700/80 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-700 text-xs uppercase tracking-wider font-bold">
                <th className="py-3.5 pl-4">Insumo</th>
                <th className="py-3.5 px-3">Categoria</th>
                <th className="py-3.5 px-3 text-right">Custo / Kg</th>
                <th className="py-3.5 px-3 text-right">Açúcar</th>
                <th className="py-3.5 px-3 text-right">Gordura</th>
                <th className="py-3.5 px-3 text-right">SLNG</th>
                <th className="py-3.5 px-3 text-right">Sólidos (ST)</th>
                <th className="py-3.5 px-3 text-right">POD</th>
                <th className="py-3.5 px-3 text-right">PAC</th>
                <th className="py-3.5 px-3 text-center">Alérgeno</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/40 text-sm">
              {filtered.map(ing => (
                <tr key={ing.id} className="hover:bg-slate-750/50 transition-colors">
                  <td className="py-3 pl-4 font-bold text-white">
                    {ing.name}
                    {ing.isCustom && (
                      <span className="ml-2 text-xs px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold">
                        Custom
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-slate-300 text-xs font-semibold">{ing.category}</td>
                  <td className="py-3 px-3 text-right font-mono font-black text-emerald-400">
                    {editingId === ing.id ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <input
                          type="number"
                          step="0.5"
                          value={editingCost}
                          onChange={e => setEditingCost(parseFloat(e.target.value) || 0)}
                          className="w-24 bg-slate-900 border border-amber-500 rounded-lg px-2 py-1 text-right text-sm text-white font-mono font-bold"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveCost(ing)}
                          className="p-1.5 text-emerald-400 hover:bg-emerald-500/20 rounded-lg"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => handleStartEditCost(ing)}
                        className="cursor-pointer hover:underline flex items-center justify-end gap-1.5 group"
                        title="Clique para editar o custo/kg deste insumo"
                      >
                        <span>R$ {ing.costKg.toFixed(2)}</span>
                        <Edit2 className="w-3.5 h-3.5 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-300">
                    {(ing.sugars * 100).toFixed(0)}%
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-300">
                    {(ing.fat * 100).toFixed(0)}%
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-300">
                    {(ing.msnf * 100).toFixed(0)}%
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-300">
                    {(ing.totalSolids * 100).toFixed(0)}%
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-black text-amber-300">
                    {ing.pod.toFixed(2)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-black text-cyan-300">
                    {ing.pac.toFixed(2)}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {ing.hasAllergen ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 font-bold">
                        Sim
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Ingredient Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Cadastrar Novo Insumo</h3>
            <form onSubmit={handleCreateIngredient} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Nome do Insumo:</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Categoria:</label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                  >
                    <option value="Açúcares">Açúcares</option>
                    <option value="Laticínios">Laticínios</option>
                    <option value="Chocolates & Cacau">Chocolates & Cacau</option>
                    <option value="Pastas & Oleaginosas">Pastas & Oleaginosas</option>
                    <option value="Neutros & Fibras">Neutros & Fibras</option>
                    <option value="Frutas">Frutas</option>
                    <option value="Variegatos & Recheios">Variegatos & Recheios</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Custo / Kg (R$):</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newCostKg || ''}
                    onChange={e => setNewCostKg(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">POD (Adoçante):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newPod || ''}
                    onChange={e => setNewPod(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">PAC (Anticongelante):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newPac || ''}
                    onChange={e => setNewPac(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-700">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">% Açúcares:</label>
                  <input
                    type="number"
                    step="1"
                    placeholder="%"
                    value={newSugars || ''}
                    onChange={e => setNewSugars(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">% Gorduras:</label>
                  <input
                    type="number"
                    step="1"
                    placeholder="%"
                    value={newFat || ''}
                    onChange={e => setNewFat(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">% SLNG:</label>
                  <input
                    type="number"
                    step="1"
                    placeholder="%"
                    value={newMsnf || ''}
                    onChange={e => setNewMsnf(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">% Outros Sólidos:</label>
                  <input
                    type="number"
                    step="1"
                    placeholder="%"
                    value={newOtherSolids || ''}
                    onChange={e => setNewOtherSolids(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white font-mono font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2.5 pt-2">
                <input
                  type="checkbox"
                  id="has-allergen-check"
                  checked={newHasAllergen}
                  onChange={e => setNewHasAllergen(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-amber-500"
                />
                <label htmlFor="has-allergen-check" className="text-xs font-semibold text-slate-300 cursor-pointer">
                  Contém Alérgeno Regulamentar (Leite, Castanha, Glúten, Soja, etc.)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-md"
                >
                  Salvar Insumo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
