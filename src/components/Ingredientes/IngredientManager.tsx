import React, { useState, useMemo } from 'react';
import { Ingredient } from '../../types/gelato';
import { db } from '../../db/database';
import {
  Search,
  Plus,
  Save,
  Edit2,
  Trash2,
  Utensils,
  X,
  Package,
  Calculator,
  AlertCircle,
  ShieldAlert,
  CheckCircle2,
  Scale,
  Sparkles,
} from 'lucide-react';

interface IngredientManagerProps {
  ingredients: Ingredient[];
  onRefresh: () => void;
}

const COMMON_ALLERGENS = [
  'Leite / Lactose',
  'Castanhas & Nozes',
  'Glúten',
  'Ovos',
  'Soja',
  'Amendoim',
] as const;

export const IngredientManager: React.FC<IngredientManagerProps> = ({ ingredients, onRefresh }) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todas');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingCost, setEditingCost] = useState<number>(0);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [modalError, setModalError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Quick packaging calculator modal for editing existing ingredients
  const [calculatorModalIng, setCalculatorModalIng] = useState<Ingredient | null>(null);
  const [calcModalPrice, setCalcModalPrice] = useState<number | ''>('');
  const [calcModalWeightGrams, setCalcModalWeightGrams] = useState<number | ''>('');

  // New ingredient form state
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Outros');

  // Packaging acquisition & weight state for new ingredients (strictly in GRAMS)
  const [packagePrice, setPackagePrice] = useState<number | ''>('');
  const [packageWeightGrams, setPackageWeightGrams] = useState<number | ''>('');
  const [costMode, setCostMode] = useState<'package' | 'direct'>('package');
  const [manualCostKg, setManualCostKg] = useState<number | ''>('');

  // Bromatological and gelato parameters
  const [newSugars, setNewSugars] = useState<number>(0);
  const [newFat, setNewFat] = useState<number>(0);
  const [newMsnf, setNewMsnf] = useState<number>(0);
  const [newOtherSolids, setNewOtherSolids] = useState<number>(0);
  const [newWater] = useState<number>(0);
  const [newPod, setNewPod] = useState<number>(0);
  const [newPac, setNewPac] = useState<number>(0);
  const [newProtein] = useState<number>(0);
  const [newHasAllergen, setNewHasAllergen] = useState<boolean>(false);
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);

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

  // Conversion of grams to kg for calculations: grams / 1000
  const effectiveWeightKg = useMemo(() => {
    if (typeof packageWeightGrams !== 'number' || packageWeightGrams <= 0) return 0;
    return packageWeightGrams / 1000;
  }, [packageWeightGrams]);

  // Automatic calculation of cost/kg: price / (grams / 1000)
  const computedCostKg = useMemo(() => {
    if (typeof packagePrice !== 'number' || packagePrice <= 0 || effectiveWeightKg <= 0) {
      return 0;
    }
    return packagePrice / effectiveWeightKg;
  }, [packagePrice, effectiveWeightKg]);

  // Effective costKg to be saved
  const finalCostKg = useMemo(() => {
    if (costMode === 'direct') {
      return typeof manualCostKg === 'number' ? Math.max(0, manualCostKg) : 0;
    }
    return computedCostKg;
  }, [costMode, manualCostKg, computedCostKg]);

  // Total solids for new ingredient preview
  const totalSolidsPercent = useMemo(() => {
    return Math.round((newSugars + newFat + newMsnf + newOtherSolids) * 10) / 10;
  }, [newSugars, newFat, newMsnf, newOtherSolids]);

  const waterPercent = useMemo(() => {
    return Math.max(0, Math.round((100 - totalSolidsPercent) * 10) / 10);
  }, [totalSolidsPercent]);

  // Quick calculator for existing ingredient
  const modalEffectiveWeightKg = useMemo(() => {
    if (typeof calcModalWeightGrams !== 'number' || calcModalWeightGrams <= 0) return 0;
    return calcModalWeightGrams / 1000;
  }, [calcModalWeightGrams]);

  const modalComputedCostKg = useMemo(() => {
    if (typeof calcModalPrice !== 'number' || calcModalPrice <= 0 || modalEffectiveWeightKg <= 0) {
      return 0;
    }
    return calcModalPrice / modalEffectiveWeightKg;
  }, [calcModalPrice, modalEffectiveWeightKg]);

  const handleStartEditCost = (ing: Ingredient) => {
    setEditingId(ing.id);
    setEditingCost(ing.costKg);
  };

  const handleSaveCost = async (ing: Ingredient) => {
    await db.ingredients.update(ing.id, { costKg: editingCost });
    setEditingId(null);
    onRefresh();
  };

  const handleOpenCalcModal = (ing: Ingredient) => {
    setCalculatorModalIng(ing);
    setCalcModalPrice(ing.packagePrice ?? '');
    setCalcModalWeightGrams(ing.packageWeight ?? '');
  };

  const handleSaveCalcModal = async () => {
    if (!calculatorModalIng) return;
    const newCost = modalComputedCostKg > 0 ? modalComputedCostKg : calculatorModalIng.costKg;
    await db.ingredients.update(calculatorModalIng.id, {
      costKg: newCost,
      packagePrice: typeof calcModalPrice === 'number' && calcModalPrice > 0 ? calcModalPrice : undefined,
      packageWeight: typeof calcModalWeightGrams === 'number' && calcModalWeightGrams > 0 ? calcModalWeightGrams : undefined,
      packageUnit: 'g',
    });
    setCalculatorModalIng(null);
    onRefresh();
  };

  const handleEditIngredient = (ing: Ingredient) => {
    setModalError('');
    setIsSaving(false);
    setEditingIngredient(ing);
    setNewName(ing.name);
    setNewCategory(ing.category || 'Outros');
    setPackagePrice(ing.packagePrice ?? '');
    const weightG = ing.packageWeight
      ? (ing.packageUnit === 'kg' ? ing.packageWeight * 1000 : ing.packageWeight)
      : (ing.costKg > 0 ? 1000 : '');
    setPackageWeightGrams(weightG);
    setCostMode(ing.packagePrice && ing.packageWeight ? 'package' : 'direct');
    setManualCostKg(ing.costKg);
    setNewSugars(Math.round((ing.sugars || 0) * 100 * 10) / 10);
    setNewFat(Math.round((ing.fat || 0) * 100 * 10) / 10);
    setNewMsnf(Math.round((ing.msnf || 0) * 100 * 10) / 10);
    setNewOtherSolids(Math.round((ing.otherSolids || 0) * 100 * 10) / 10);
    setNewPod(ing.pod || 0);
    setNewPac(ing.pac || 0);
    setNewHasAllergen(!!ing.hasAllergen);
    setSelectedAllergens(ing.allergenDetails || []);
    setIsAddModalOpen(true);
  };

  const handleDeleteIngredient = async (ing: Ingredient) => {
    if (window.confirm(`Deseja realmente excluir o insumo "${ing.name}"? Esta ação removerá o insumo da tabela.`)) {
      await db.ingredients.delete(ing.id);
      onRefresh();
    }
  };

  const toggleAllergen = (allergen: string) => {
    setSelectedAllergens(prev =>
      prev.includes(allergen) ? prev.filter(a => a !== allergen) : [...prev, allergen]
    );
  };

  const resetForm = () => {
    setEditingIngredient(null);
    setModalError('');
    setIsSaving(false);
    setNewName('');
    setNewCategory('Outros');
    setPackagePrice('');
    setPackageWeightGrams('');
    setCostMode('package');
    setManualCostKg('');
    setNewSugars(0);
    setNewFat(0);
    setNewMsnf(0);
    setNewOtherSolids(0);
    setNewPod(0);
    setNewPac(0);
    setNewHasAllergen(false);
    setSelectedAllergens([]);
  };

  const handleCreateIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');

    if (!newName.trim()) {
      setModalError('Por favor, informe o nome técnico da matéria-prima.');
      return;
    }

    if (totalSolidsPercent > 100) {
      const proceed = window.confirm(
        `Atenção: A soma dos sólidos informados (${totalSolidsPercent}%) ultrapassa 100%. Deseja salvar mesmo assim?`
      );
      if (!proceed) return;
    }

    setIsSaving(true);
    try {
      const totalSolids = (newSugars + newFat + newMsnf + newOtherSolids) / 100;
      const targetId = editingIngredient ? editingIngredient.id : `ing_custom_${Date.now()}`;

      const ingToSave: Ingredient = {
        id: targetId,
        name: newName.trim(),
        category: newCategory,
        costKg: finalCostKg || 0,
        packagePrice: typeof packagePrice === 'number' && packagePrice > 0 ? packagePrice : undefined,
        packageWeight: typeof packageWeightGrams === 'number' && packageWeightGrams > 0 ? packageWeightGrams : undefined,
        packageUnit: 'g',
        sugars: (newSugars || 0) / 100,
        fat: (newFat || 0) / 100,
        msnf: (newMsnf || 0) / 100,
        otherSolids: (newOtherSolids || 0) / 100,
        totalSolids,
        water: newWater > 0 ? newWater / 100 : Math.max(0, 1 - totalSolids),
        pod: newPod || 0,
        pac: newPac || 0,
        protein: (newProtein || 0) / 100,
        hasAllergen: newHasAllergen,
        allergenDetails: newHasAllergen && selectedAllergens.length > 0 ? selectedAllergens : undefined,
        isCustom: editingIngredient ? editingIngredient.isCustom : true,
      };

      await db.ingredients.put(ingToSave);
      setIsAddModalOpen(false);
      setEditingIngredient(null);
      resetForm();
      onRefresh();
    } catch (err: any) {
      console.error('Erro ao salvar insumo no banco:', err);
      setModalError(`Erro ao salvar no banco de dados: ${err?.message || err}`);
    } finally {
      setIsSaving(false);
    }
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
            onClick={() => {
              resetForm();
              setIsAddModalOpen(true);
            }}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-amber-500/25 transition-all flex items-center gap-2 self-start md:self-auto active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Novo Insumo</span>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="space-y-3">
          <div className="relative w-full">
            <Search className="w-5 h-5 text-amber-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nome do insumo (ex: leite, cacau, açúcar, pistache)..."
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
            {categories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all ${
                  categoryFilter === cat
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
                <th className="py-3.5 px-3 text-center">Ações</th>
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
                          min="0"
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
                          title="Salvar custo"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-1.5 group">
                        <button
                          type="button"
                          onClick={() => handleOpenCalcModal(ing)}
                          className="p-1 text-slate-500 hover:text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity rounded"
                          title="Recalcular custo por preço pago e peso em gramas"
                        >
                          <Calculator className="w-3.5 h-3.5" />
                        </button>
                        <div
                          onClick={() => handleStartEditCost(ing)}
                          className="cursor-pointer hover:underline flex items-center gap-1"
                          title="Clique para editar o custo/kg deste insumo"
                        >
                          <span>R$ {ing.costKg.toFixed(2)}</span>
                          <Edit2 className="w-3.5 h-3.5 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
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
                  {/* Actions Column */}
                  <td className="py-3 px-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleEditIngredient(ing)}
                        className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-amber-500/15 rounded-lg transition-all"
                        title={`Editar todos os dados de "${ing.name}"`}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteIngredient(ing)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 rounded-lg transition-all"
                        title={`Excluir "${ing.name}"`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Cadastrar ou Editar Insumo */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700/90 rounded-3xl w-full max-w-xl sm:max-w-2xl p-5 sm:p-7 shadow-2xl space-y-5 my-6 max-h-[92vh] overflow-y-auto">
            {/* Cabeçalho do Modal */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-xl shadow-lg shadow-amber-500/20 shrink-0">
                  🍨
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                    <span>{editingIngredient ? `Editar Insumo: ${editingIngredient.name}` : 'Cadastrar Novo Insumo'}</span>
                    <Sparkles className="w-4 h-4 text-amber-400" />
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {editingIngredient
                      ? 'Edite os valores comerciais, preços e parâmetros bromatológicos deste insumo.'
                      : 'Defina os dados comerciais de aquisição e o perfil bromatológico da matéria-prima.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingIngredient(null);
                }}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors shrink-0"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateIngredient} noValidate className="space-y-4">
              {/* Seção 1: Identificação Básica */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1.5">
                    Nome da Matéria-Prima:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ex: Pasta de Pistache Siciliano Puro..."
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 font-medium focus:border-amber-500 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1.5">
                    Categoria Gastronômica:
                  </label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-medium focus:border-amber-500 focus:outline-none transition-colors"
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

              {/* Seção 2: Aquisição & Custo Comercial */}
              <div className="bg-slate-950/60 p-4 sm:p-5 rounded-2xl border border-slate-700/80 space-y-4 shadow-inner">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                      <Package className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black tracking-wide text-white uppercase">
                        Aquisição & Custo por Embalagem
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Informe o valor pago e o peso em gramas para cálculo automático.
                      </p>
                    </div>
                  </div>

                  {/* Segmented Control Nivelado */}
                  <div className="inline-flex items-center bg-slate-900 p-1 rounded-xl border border-slate-700/80 text-xs shrink-0 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setCostMode('package')}
                      className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                        costMode === 'package'
                          ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Package className="w-3.5 h-3.5" />
                      <span>Por Embalagem (g)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCostMode('direct')}
                      className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                        costMode === 'direct'
                          ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Scale className="w-3.5 h-3.5" />
                      <span>Custo Direto (R$/kg)</span>
                    </button>
                  </div>
                </div>

                {costMode === 'package' ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {/* 1. Preço Pago na Embalagem */}
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center justify-between">
                          <span>Preço Pago na Embalagem:</span>
                          <span className="text-[10px] text-slate-400">Valor total na Nota</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-2.5 text-xs font-mono font-bold text-slate-400">
                            R$
                          </span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            
                            placeholder="0,00"
                            value={packagePrice === '' ? '' : packagePrice}
                            onChange={e => {
                              const val = e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0);
                              setPackagePrice(val);
                            }}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white font-mono font-bold focus:border-amber-500 focus:outline-none transition-colors"
                          />
                        </div>
                      </div>

                      {/* 2. Peso Líquido da Embalagem em GRAMAS */}
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center justify-between">
                          <span>Peso Líquido da Embalagem:</span>
                          <span className="text-[10px] text-amber-400 font-bold">Medido em Gramas (g)</span>
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            
                            placeholder="ex: 1000 (para 1 kg), 500, 250..."
                            value={packageWeightGrams === '' ? '' : packageWeightGrams}
                            onChange={e => {
                              const val = e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0);
                              setPackageWeightGrams(val);
                            }}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-3.5 pr-12 py-2.5 text-sm text-white font-mono font-bold focus:border-amber-500 focus:outline-none transition-colors"
                          />
                          <span className="absolute right-3.5 top-2 text-xs font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-md">
                            g
                          </span>
                        </div>

                        {/* Atalhos Rápidos em Gramas */}
                        <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-0.5 text-[10px]">
                          <span className="text-slate-500 text-[10px] shrink-0 font-medium">Atalhos:</span>
                          {[100, 200, 250, 500, 1000, 3000, 5000].map(g => (
                            <button
                              key={g}
                              type="button"
                              onClick={() => setPackageWeightGrams(g)}
                              className={`px-2 py-0.5 rounded-md font-mono font-semibold transition-all shrink-0 ${
                                packageWeightGrams === g
                                  ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                                  : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
                              }`}
                            >
                              {g >= 1000 ? `${g}g (${g / 1000}kg)` : `${g}g`}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Card de Resultado do Custo por Kg com Gradiente Suave */}
                    <div
                      className={`rounded-2xl p-4 border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        computedCostKg > 0
                          ? 'bg-gradient-to-r from-emerald-500/10 via-emerald-500/15 to-emerald-500/10 border-emerald-500/30 text-emerald-300 shadow-sm'
                          : 'bg-slate-900/80 border-slate-700/60 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-inner ${
                            computedCostKg > 0
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-slate-800 text-slate-500 border border-slate-700'
                          }`}
                        >
                          <Calculator className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-200 block">
                            Custo Unitário Efetivo Calculado
                          </span>
                          <span className="text-xs text-slate-400">
                            {computedCostKg > 0 ? (
                              <span className="inline-flex items-center gap-1.5 flex-wrap">
                                <span>Memória:</span>
                                <strong className="font-mono text-white">
                                  R$ {Number(packagePrice).toFixed(2)}
                                </strong>
                                <span>÷</span>
                                <strong className="font-mono text-white">
                                  {packageWeightGrams} g ({effectiveWeightKg.toFixed(3)} kg)
                                </strong>
                              </span>
                            ) : (
                              'Preencha o valor pago e o peso em gramas para calcular automaticamente.'
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="sm:text-right shrink-0">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                          Custo Base por Quilo
                        </span>
                        <span
                          className={`text-xl sm:text-2xl font-black font-mono tracking-tight ${
                            computedCostKg > 0 ? 'text-emerald-400' : 'text-slate-500'
                          }`}
                        >
                          R$ {computedCostKg.toFixed(2)}{' '}
                          <span className="text-xs font-semibold text-slate-400">/ kg</span>
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  /* Modo Direto: Digitar Custo/Kg */
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-300 flex items-center justify-between">
                      <span>Custo Direto por Quilo (R$/kg):</span>
                      <button
                        type="button"
                        onClick={() => setCostMode('package')}
                        className="text-[11px] text-amber-400 hover:underline font-normal"
                      >
                        Alternar para cálculo por peso em gramas
                      </button>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-xs font-mono font-bold text-slate-400">
                        R$
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        
                        placeholder="0,00"
                        value={manualCostKg === '' ? '' : manualCostKg}
                        onChange={e => {
                          const val = e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0);
                          setManualCostKg(val);
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white font-mono font-bold focus:border-amber-500 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Seção 3: Parâmetros Bromatológicos de Gelateria (POD & PAC) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* POD */}
                <div className="bg-slate-950/60 p-3.5 sm:p-4 rounded-2xl border border-slate-700/80 space-y-2 shadow-inner">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-200 block">
                        POD (Poder Adoçante)
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Sensação de dulçor perceptível
                      </span>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      Ref: Sacarose 1.0
                    </span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={newPod || ''}
                    onChange={e => setNewPod(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white font-mono font-bold focus:border-amber-500 focus:outline-none transition-colors"
                  />
                </div>

                {/* PAC */}
                <div className="bg-slate-950/60 p-3.5 sm:p-4 rounded-2xl border border-slate-700/80 space-y-2 shadow-inner">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-200 block">
                        PAC (Anticongelante)
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Ponto de congelamento e maciez
                      </span>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                      Ref: Sacarose 1.0
                    </span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={newPac || ''}
                    onChange={e => setNewPac(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white font-mono font-bold focus:border-amber-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Seção 4: Composição Bromatológica & Barra Visual Dinâmica de Sólidos */}
              <div className="bg-slate-950/60 p-4 sm:p-5 rounded-2xl border border-slate-700/80 space-y-3.5 shadow-inner">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-black tracking-wide text-white uppercase">
                      Composição Centesimal (% em Massa)
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Distribuição nutricional de sólidos e água por 100g de matéria-prima.
                    </p>
                  </div>

                  <div className="inline-flex items-center gap-2 font-mono text-xs">
                    <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold">
                      ST: {totalSolidsPercent}%
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-bold">
                      Água: {waterPercent}%
                    </span>
                  </div>
                </div>

                {/* Barra Visual Dinâmica Multicores de Sólidos vs Água */}
                <div className="space-y-1.5">
                  <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden flex shadow-inner border border-slate-700/60">
                    {newSugars > 0 && (
                      <div
                        style={{ width: `${Math.min(100, newSugars)}%` }}
                        className="bg-amber-500 transition-all duration-300"
                        title={`Açúcares: ${newSugars}%`}
                      />
                    )}
                    {newFat > 0 && (
                      <div
                        style={{ width: `${Math.min(100 - newSugars, newFat)}%` }}
                        className="bg-yellow-400 transition-all duration-300"
                        title={`Gorduras: ${newFat}%`}
                      />
                    )}
                    {newMsnf > 0 && (
                      <div
                        style={{ width: `${Math.min(100 - newSugars - newFat, newMsnf)}%` }}
                        className="bg-blue-400 transition-all duration-300"
                        title={`SLNG: ${newMsnf}%`}
                      />
                    )}
                    {newOtherSolids > 0 && (
                      <div
                        style={{
                          width: `${Math.min(100 - newSugars - newFat - newMsnf, newOtherSolids)}%`,
                        }}
                        className="bg-purple-400 transition-all duration-300"
                        title={`Outros Sólidos: ${newOtherSolids}%`}
                      />
                    )}
                    {waterPercent > 0 && totalSolidsPercent <= 100 && (
                      <div
                        style={{ width: `${waterPercent}%` }}
                        className="bg-cyan-500/40 transition-all duration-300"
                        title={`Água Estimada: ${waterPercent}%`}
                      />
                    )}
                  </div>

                  {/* Legenda Visual */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      Açúcares
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-yellow-400" />
                      Gorduras
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-blue-400" />
                      SLNG
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-purple-400" />
                      Outros Sólidos
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-cyan-400" />
                      Água
                    </span>
                  </div>
                </div>

                {/* 4 Inputs de Nutrientes */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Açúcares (Glicídios)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        placeholder="0"
                        value={newSugars || ''}
                        onChange={e => setNewSugars(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-3 pr-7 py-2 text-xs text-white font-mono font-bold focus:border-amber-500 focus:outline-none transition-colors"
                      />
                      <span className="absolute right-2.5 top-2 text-xs font-mono font-bold text-slate-400">
                        %
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Gorduras (Lipídios)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        placeholder="0"
                        value={newFat || ''}
                        onChange={e => setNewFat(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-3 pr-7 py-2 text-xs text-white font-mono font-bold focus:border-amber-500 focus:outline-none transition-colors"
                      />
                      <span className="absolute right-2.5 top-2 text-xs font-mono font-bold text-slate-400">
                        %
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      SLNG (Leite)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        placeholder="0"
                        value={newMsnf || ''}
                        onChange={e => setNewMsnf(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-3 pr-7 py-2 text-xs text-white font-mono font-bold focus:border-amber-500 focus:outline-none transition-colors"
                      />
                      <span className="absolute right-2.5 top-2 text-xs font-mono font-bold text-slate-400">
                        %
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Outros Sólidos
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        placeholder="0"
                        value={newOtherSolids || ''}
                        onChange={e => setNewOtherSolids(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-3 pr-7 py-2 text-xs text-white font-mono font-bold focus:border-amber-500 focus:outline-none transition-colors"
                      />
                      <span className="absolute right-2.5 top-2 text-xs font-mono font-bold text-slate-400">
                        %
                      </span>
                    </div>
                  </div>
                </div>

                {totalSolidsPercent > 100 && (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>
                      Atenção: A soma dos sólidos ({totalSolidsPercent}%) ultrapassa 100%! Verifique
                      os percentuais informados.
                    </span>
                  </div>
                )}
              </div>

              {/* Seção 5: Segurança Sanitária & Alérgenos com Toggle Switch */}
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-700/80 space-y-3 shadow-inner">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center transition-colors ${
                        newHasAllergen
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      <ShieldAlert className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-200 block">
                        Alérgeno Regulamentar (RDC Anvisa)
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Sinaliza presença de componentes alérgicos na rotulagem da receita
                      </span>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newHasAllergen}
                      onChange={e => {
                        setNewHasAllergen(e.target.checked);
                        if (!e.target.checked) setSelectedAllergens([]);
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-500"></div>
                  </label>
                </div>

                {newHasAllergen && (
                  <div className="pt-2 border-t border-slate-800 space-y-2">
                    <span className="text-[11px] font-semibold text-slate-300 block">
                      Selecione os alérgenos presentes nesta matéria-prima:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {COMMON_ALLERGENS.map(allergen => {
                        const isSelected = selectedAllergens.includes(allergen);
                        return (
                          <button
                            key={allergen}
                            type="button"
                            onClick={() => toggleAllergen(allergen)}
                            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                              isSelected
                                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20 scale-[1.02]'
                                : 'bg-slate-800/90 text-slate-300 hover:text-white hover:bg-slate-700/80 border border-slate-700/60'
                            }`}
                          >
                            <span>{isSelected ? '✓' : '+'}</span>
                            <span>{allergen}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Alerta de Validação ou Erro */}
              {modalError && (
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Rodapé de Ações */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingIngredient(null);
                  }}
                  className="px-4 py-2.5 text-xs font-bold text-slate-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-amber-500/25 transition-all active:scale-95 flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{editingIngredient ? 'Salvar Alterações' : 'Cadastrar Insumo'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Rápido: Recalcular Custo de Insumo Existente por Peso em Gramas */}
      {calculatorModalIng && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-md p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-inner border border-emerald-500/30">
                  <Calculator className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Recalcular Custo / Kg</h3>
                  <p className="text-xs text-slate-400">{calculatorModalIng.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCalculatorModalIng(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Preço Pago na Embalagem:
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs font-mono font-bold text-slate-400">
                    R$
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0,00"
                    value={calcModalPrice === '' ? '' : calcModalPrice}
                    onChange={e => {
                      const val = e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0);
                      setCalcModalPrice(val);
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2 text-sm text-white font-mono font-bold focus:border-amber-500 focus:outline-none"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center justify-between">
                  <span>Peso Líquido da Embalagem:</span>
                  <span className="text-[10px] text-amber-400 font-bold">Medido em Gramas (g)</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    step="any"
                    placeholder="ex: 1000 (para 1 kg), 500, 250..."
                    value={calcModalWeightGrams === '' ? '' : calcModalWeightGrams}
                    onChange={e => {
                      const val = e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0);
                      setCalcModalWeightGrams(val);
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-3.5 pr-12 py-2 text-sm text-white font-mono font-bold focus:border-amber-500 focus:outline-none"
                  />
                  <span className="absolute right-3.5 top-2 text-xs font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-md">
                    g
                  </span>
                </div>

                <div className="flex items-center gap-1.5 mt-1.5 overflow-x-auto pb-0.5 text-[10px]">
                  {[100, 200, 250, 500, 1000, 3000, 5000].map(g => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setCalcModalWeightGrams(g)}
                      className={`px-2 py-0.5 rounded font-mono font-semibold transition-all shrink-0 ${
                        calcModalWeightGrams === g
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'bg-slate-750 text-slate-300 hover:text-white hover:bg-slate-700'
                      }`}
                    >
                      {g >= 1000 ? `${g}g (${g / 1000}kg)` : `${g}g`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Resultado do Custo Calculado */}
              <div className="bg-slate-950/60 rounded-2xl p-3.5 border border-slate-800 flex items-center justify-between shadow-inner">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Novo Custo por Quilo
                  </span>
                  <span className="text-xs text-slate-400">
                    Atual: <span className="font-mono text-slate-300">R$ {calculatorModalIng.costKg.toFixed(2)}</span>
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black font-mono text-emerald-400 block">
                    R$ {modalComputedCostKg > 0 ? modalComputedCostKg.toFixed(2) : calculatorModalIng.costKg.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-slate-400">/ kg</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setCalculatorModalIng(null)}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveCalcModal}
                disabled={modalComputedCostKg <= 0}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center gap-1.5 active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Aplicar Novo Custo</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
