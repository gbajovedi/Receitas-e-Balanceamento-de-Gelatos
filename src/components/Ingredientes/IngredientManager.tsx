import React, { useState, useMemo } from 'react';
import { Ingredient } from '../../types/gelato';
import { db } from '../../db/database';
import { Search, Plus, Save, Edit2, Trash2 } from 'lucide-react';

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
  const [newWater, setNewWater] = useState<number>(0);
  const [newPod, setNewPod] = useState<number>(0);
  const [newPac, setNewPac] = useState<number>(0);
  const [newProtein, setNewProtein] = useState<number>(0);
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
    // Reset form
    setNewName('');
    setNewCostKg(0);
    onRefresh();
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-16">
      {/* Header Card */}
      <div className="bg-slate-800/90 rounded-2xl border border-slate-700 p-5 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>🥄</span>
              <span>Tabela de Insumos & Matérias-Primas</span>
            </h2>
            <p className="text-xs text-slate-400">
              {ingredients.length} insumos cadastrados com fatores de PAC, POD, composição e custos/kg.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/25 transition-all flex items-center gap-1.5 self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Novo Insumo</span>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nome do insumo..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            {categories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  categoryFilter === cat
                    ? 'bg-amber-500 text-slate-950 shadow-md'
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
      <div className="bg-slate-800/90 rounded-2xl border border-slate-700 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-900/80 text-slate-400 border-b border-slate-700 font-semibold">
                <th className="py-3 pl-4">Insumo</th>
                <th className="py-3 px-2">Categoria</th>
                <th className="py-3 px-2 text-right">Custo / Kg</th>
                <th className="py-3 px-2 text-right">Açúcar</th>
                <th className="py-3 px-2 text-right">Gordura</th>
                <th className="py-3 px-2 text-right">SLNG</th>
                <th className="py-3 px-2 text-right">ST (Sólidos)</th>
                <th className="py-3 px-2 text-right">POD</th>
                <th className="py-3 px-2 text-right">PAC</th>
                <th className="py-3 px-2 text-center">Alérgeno</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/40">
              {filtered.map(ing => (
                <tr key={ing.id} className="hover:bg-slate-750/40 transition-colors">
                  <td className="py-2.5 pl-4 font-semibold text-white">
                    {ing.name}
                    {ing.isCustom && (
                      <span className="ml-1.5 text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        Custom
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-2 text-slate-400">{ing.category}</td>
                  <td className="py-2.5 px-2 text-right font-mono font-bold text-emerald-400">
                    {editingId === ing.id ? (
                      <div className="flex items-center justify-end gap-1">
                        <input
                          type="number"
                          step="0.5"
                          value={editingCost}
                          onChange={e => setEditingCost(parseFloat(e.target.value) || 0)}
                          className="w-20 bg-slate-900 border border-amber-500 rounded px-1.5 py-0.5 text-right text-xs text-white font-mono"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveCost(ing)}
                          className="p-1 text-emerald-400 hover:bg-emerald-500/20 rounded"
                        >
                          <Save className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => handleStartEditCost(ing)}
                        className="cursor-pointer hover:underline flex items-center justify-end gap-1 group"
                        title="Clique para editar o custo/kg"
                      >
                        <span>R$ {ing.costKg.toFixed(2)}</span>
                        <Edit2 className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    )}
                  </td>
                  <td className="py-2.5 px-2 text-right font-mono text-slate-300">
                    {(ing.sugars * 100).toFixed(0)}%
                  </td>
                  <td className="py-2.5 px-2 text-right font-mono text-slate-300">
                    {(ing.fat * 100).toFixed(0)}%
                  </td>
                  <td className="py-2.5 px-2 text-right font-mono text-slate-300">
                    {(ing.msnf * 100).toFixed(0)}%
                  </td>
                  <td className="py-2.5 px-2 text-right font-mono text-slate-300">
                    {(ing.totalSolids * 100).toFixed(0)}%
                  </td>
                  <td className="py-2.5 px-2 text-right font-mono font-semibold text-amber-300">
                    {ing.pod.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-2 text-right font-mono font-semibold text-cyan-300">
                    {ing.pac.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    {ing.hasAllergen ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30">
                        Sim
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500">-</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Cadastrar Novo Insumo</h3>
            <form onSubmit={handleCreateIngredient} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-300 mb-1">Nome do Insumo:</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-300 mb-1">Categoria:</label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
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
                  <label className="block text-[11px] text-slate-300 mb-1">Custo / Kg (R$):</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newCostKg || ''}
                    onChange={e => setNewCostKg(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-300 mb-1">POD (Poder Adoçante):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newPod || ''}
                    onChange={e => setNewPod(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-300 mb-1">PAC (Anticongelante):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newPac || ''}
                    onChange={e => setNewPac(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-700">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">% Açúcares:</label>
                  <input
                    type="number"
                    step="1"
                    placeholder="%"
                    value={newSugars || ''}
                    onChange={e => setNewSugars(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">% Gorduras:</label>
                  <input
                    type="number"
                    step="1"
                    placeholder="%"
                    value={newFat || ''}
                    onChange={e => setNewFat(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">% SLNG:</label>
                  <input
                    type="number"
                    step="1"
                    placeholder="%"
                    value={newMsnf || ''}
                    onChange={e => setNewMsnf(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">% Outros Sólidos:</label>
                  <input
                    type="number"
                    step="1"
                    placeholder="%"
                    value={newOtherSolids || ''}
                    onChange={e => setNewOtherSolids(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="has-allergen-check"
                  checked={newHasAllergen}
                  onChange={e => setNewHasAllergen(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-amber-500"
                />
                <label htmlFor="has-allergen-check" className="text-xs text-slate-300">
                  Contém Alérgeno Regulamentar (Leite, Castanha, Glúten, Soja, etc.)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl"
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

