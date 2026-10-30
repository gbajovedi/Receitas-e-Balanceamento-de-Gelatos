import React, { useState, useMemo } from 'react';
import { Ingredient } from '../../types/gelato';
import { db } from '../../db/database';
import { Search, Plus, Save, Edit2, Utensils, X, Package, Calculator, DollarSign, Scale, AlertCircle } from 'lucide-react';

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

  // Quick packaging calculator modal for editing existing ingredients
  const [calculatorModalIng, setCalculatorModalIng] = useState<Ingredient | null>(null);
  const [calcModalPrice, setCalcModalPrice] = useState<number | ''>('');
  const [calcModalWeight, setCalcModalWeight] = useState<number | ''>('');
  const [calcModalUnit, setCalcModalUnit] = useState<'kg' | 'g'>('kg');

  // New ingredient form state
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Outros');

  // Packaging acquisition & weight state for new ingredients
  const [packagePrice, setPackagePrice] = useState<number | ''>('');
  const [packageWeight, setPackageWeight] = useState<number | ''>('');
  const [packageUnit, setPackageUnit] = useState<'kg' | 'g'>('kg');
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

  // Conversion of new ingredient package weight to kg
  const effectiveWeightKg = useMemo(() => {
    if (typeof packageWeight !== 'number' || packageWeight <= 0) return 0;
    return packageUnit === 'g' ? packageWeight / 1000 : packageWeight;
  }, [packageWeight, packageUnit]);

  // Automatic calculation of cost/kg for new ingredient
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
    return newSugars + newFat + newMsnf + newOtherSolids;
  }, [newSugars, newFat, newMsnf, newOtherSolids]);

  // Quick calculator for existing ingredient
  const modalEffectiveWeightKg = useMemo(() => {
    if (typeof calcModalWeight !== 'number' || calcModalWeight <= 0) return 0;
    return calcModalUnit === 'g' ? calcModalWeight / 1000 : calcModalWeight;
  }, [calcModalWeight, calcModalUnit]);

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
    setCalcModalWeight(ing.packageWeight ?? '');
    setCalcModalUnit(ing.packageUnit ?? 'kg');
  };

  const handleSaveCalcModal = async () => {
    if (!calculatorModalIng) return;
    const newCost = modalComputedCostKg > 0 ? modalComputedCostKg : calculatorModalIng.costKg;
    await db.ingredients.update(calculatorModalIng.id, {
      costKg: newCost,
      packagePrice: typeof calcModalPrice === 'number' && calcModalPrice > 0 ? calcModalPrice : undefined,
      packageWeight: typeof calcModalWeight === 'number' && calcModalWeight > 0 ? calcModalWeight : undefined,
      packageUnit: calcModalUnit,
    });
    setCalculatorModalIng(null);
    onRefresh();
  };

  const resetForm = () => {
    setNewName('');
    setNewCategory('Outros');
    setPackagePrice('');
    setPackageWeight('');
    setPackageUnit('kg');
    setCostMode('package');
    setManualCostKg('');
    setNewSugars(0);
    setNewFat(0);
    setNewMsnf(0);
    setNewOtherSolids(0);
    setNewPod(0);
    setNewPac(0);
    setNewHasAllergen(false);
  };

  const handleCreateIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const totalSolids = (newSugars + newFat + newMsnf + newOtherSolids) / 100;

    const newIng: Ingredient = {
      id: `ing_custom_${Date.now()}`,
      name: newName.trim(),
      category: newCategory,
      costKg: finalCostKg,
      packagePrice: typeof packagePrice === 'number' && packagePrice > 0 ? packagePrice : undefined,
      packageWeight: typeof packageWeight === 'number' && packageWeight > 0 ? packageWeight : undefined,
      packageUnit: packageUnit,
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
      isCustom: true,
    };

    await db.ingredients.put(newIng);
    setIsAddModalOpen(false);
    resetForm();
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
                          title="Recalcular custo a partir do preço e peso da embalagem"
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Cadastrar Novo Insumo */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-xl p-5 sm:p-7 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Utensils className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Cadastrar Novo Insumo</h3>
                  <p className="text-xs text-slate-400">
                    Preencha os valores de aquisição da matéria-prima e seus dados bromatológicos.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateIngredient} className="space-y-4">
              {/* Seção 1: Identificação */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Nome Técnico da Matéria-Prima:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ex: Pasta de Pistache Puro, Sacarose..."
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-medium focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Categoria Gastronômica:
                  </label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-medium focus:border-amber-500 focus:outline-none"
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

              {/* Seção 2: Aquisição & Custo Unitário Comercial (Cálculo Automático por Embalagem) */}
              <div className="bg-slate-950/60 p-4 sm:p-5 rounded-2xl border border-slate-700/80 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                      <Package className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black tracking-wide uppercase text-slate-200">
                        Aquisição & Custo da Embalagem Comercial
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Informe o valor pago e o peso da embalagem para calcular o custo/kg automaticamente.
                      </p>
                    </div>
                  </div>

                  {/* Alternador de Modo */}
                  <div className="hidden sm:flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-700/80 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setCostMode('package')}
                      className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                        costMode === 'package'
                          ? 'bg-amber-500 text-slate-950 shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Por Embalagem
                    </button>
                    <button
                      type="button"
                      onClick={() => setCostMode('direct')}
                      className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                        costMode === 'direct'
                          ? 'bg-amber-500 text-slate-950 shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Custo Direto (R$/kg)
                    </button>
                  </div>
                </div>

                {costMode === 'package' ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {/* 1. Preço de Aquisição da Embalagem */}
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center justify-between">
                          <span>Preço Pago na Embalagem:</span>
                          <span className="text-[10px] text-slate-400 font-normal">Valor Pago na Nota</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-xs font-mono font-bold text-slate-400">
                            R$
                          </span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            required={costMode === 'package'}
                            placeholder="0,00"
                            value={packagePrice === '' ? '' : packagePrice}
                            onChange={e => {
                              const val = e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0);
                              setPackagePrice(val);
                            }}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-white font-mono font-bold focus:border-amber-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* 2. Conteúdo Líquido da Embalagem */}
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center justify-between">
                          <span>Peso Líquido da Embalagem:</span>
                          <span className="text-[10px] text-slate-400 font-normal">Conteúdo Declarado</span>
                        </label>
                        <div className="flex rounded-xl overflow-hidden border border-slate-700 bg-slate-900 focus-within:border-amber-500">
                          <input
                            type="number"
                            min="0"
                            step={packageUnit === 'g' ? '1' : '0.001'}
                            required={costMode === 'package'}
                            placeholder={packageUnit === 'g' ? 'ex: 500' : 'ex: 1.000'}
                            value={packageWeight === '' ? '' : packageWeight}
                            onChange={e => {
                              const val = e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0);
                              setPackageWeight(val);
                            }}
                            className="flex-1 bg-transparent px-3 py-2 text-sm text-white font-mono font-bold focus:outline-none"
                          />
                          {/* Seletor de Unidade Integrado */}
                          <div className="flex items-center bg-slate-800 p-1 gap-1 border-l border-slate-700">
                            <button
                              type="button"
                              onClick={() => setPackageUnit('kg')}
                              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                                packageUnit === 'kg'
                                  ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                              title="Quilogramas"
                            >
                              kg
                            </button>
                            <button
                              type="button"
                              onClick={() => setPackageUnit('g')}
                              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                                packageUnit === 'g'
                                  ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                              title="Gramas"
                            >
                              g
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Banner de Resultado Automático do Custo por Kg */}
                    <div
                      className={`rounded-xl p-3.5 border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                        computedCostKg > 0
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                          : 'bg-slate-900/80 border-slate-700/60 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            computedCostKg > 0
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-slate-800 text-slate-500'
                          }`}
                        >
                          <Calculator className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[11px] uppercase tracking-wider font-bold block text-slate-300">
                            Custo Unitário Efetivo Calculado
                          </span>
                          <span className="text-xs">
                            {computedCostKg > 0 ? (
                              <>
                                Memória de Cálculo:{' '}
                                <strong className="font-mono text-white">
                                  R$ {Number(packagePrice).toFixed(2)}
                                </strong>{' '}
                                ÷{' '}
                                <strong className="font-mono text-white">
                                  {packageUnit === 'g'
                                    ? `${packageWeight} g (${effectiveWeightKg.toFixed(3)} kg)`
                                    : `${packageWeight} kg`}
                                </strong>
                              </>
                            ) : (
                              'Preencha o preço e o peso da embalagem para calcular.'
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="sm:text-right shrink-0">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Custo de Reposição / kg
                        </span>
                        <span
                          className={`text-base sm:text-lg font-black font-mono tracking-tight ${
                            computedCostKg > 0 ? 'text-emerald-400' : 'text-slate-500'
                          }`}
                        >
                          R$ {computedCostKg.toFixed(2)}{' '}
                          <span className="text-xs font-semibold">/ kg</span>
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  /* Modo Direto: Digitar Custo/Kg */
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center justify-between">
                      <span>Custo Direto por Quilo (R$/kg):</span>
                      <button
                        type="button"
                        onClick={() => setCostMode('package')}
                        className="text-[11px] text-amber-400 hover:underline font-normal"
                      >
                        Alternar para cálculo por embalagem
                      </button>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs font-mono font-bold text-slate-400">
                        R$
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        required={costMode === 'direct'}
                        placeholder="0,00"
                        value={manualCostKg === '' ? '' : manualCostKg}
                        onChange={e => {
                          const val = e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0);
                          setManualCostKg(val);
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-white font-mono font-bold focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Seção 3: Parâmetros de Gelateria (POD & PAC) */}
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center justify-between">
                    <span>POD (Poder Adoçante Relativo):</span>
                    <span className="text-[10px] text-amber-400 font-mono">Sacarose = 1.00</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={newPod || ''}
                    onChange={e => setNewPod(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono font-bold focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center justify-between">
                    <span>PAC (Poder Anticongelante):</span>
                    <span className="text-[10px] text-cyan-400 font-mono">Sacarose = 1.00</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={newPac || ''}
                    onChange={e => setNewPac(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono font-bold focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Seção 4: Composição Centesimal (% ST) */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 block">
                    Composição Bromatológica Centesimal (% em Massa):
                  </label>
                  <div className="text-[11px] font-mono">
                    <span className="text-slate-400">Sólidos Totais (ST): </span>
                    <strong
                      className={`font-black ${
                        totalSolidsPercent > 100 ? 'text-rose-400' : 'text-amber-400'
                      }`}
                    >
                      {totalSolidsPercent}%
                    </strong>
                    <span className="text-slate-400 ml-2">Água: </span>
                    <strong className="text-cyan-400 font-black">
                      {Math.max(0, 100 - totalSolidsPercent)}%
                    </strong>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      % Açúcares
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      placeholder="%"
                      value={newSugars || ''}
                      onChange={e => setNewSugars(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono font-bold focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      % Gorduras
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      placeholder="%"
                      value={newFat || ''}
                      onChange={e => setNewFat(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono font-bold focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      % SLNG
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      placeholder="%"
                      value={newMsnf || ''}
                      onChange={e => setNewMsnf(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono font-bold focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      % Outros
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      placeholder="%"
                      value={newOtherSolids || ''}
                      onChange={e => setNewOtherSolids(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono font-bold focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                {totalSolidsPercent > 100 && (
                  <div className="flex items-center gap-1.5 text-rose-400 text-xs mt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Atenção: A soma dos percentuais de sólidos não pode exceder 100%!</span>
                  </div>
                )}
              </div>

              {/* Seção 5: Alérgenos */}
              <div className="flex items-center gap-2.5 pt-1">
                <input
                  type="checkbox"
                  id="has-allergen-check"
                  checked={newHasAllergen}
                  onChange={e => setNewHasAllergen(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-amber-500"
                />
                <label
                  htmlFor="has-allergen-check"
                  className="text-xs font-semibold text-slate-300 cursor-pointer select-none"
                >
                  Contém Alérgeno Regulamentar (Leite, Castanha, Glúten, Soja, etc.)
                </label>
              </div>

              {/* Rodapé de Ações */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-amber-500/25 transition-all active:scale-95 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Salvar Insumo</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Rápido: Recalcular Custo de Insumo Existente por Embalagem */}
      {calculatorModalIng && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-md p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
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
                className="p-1 text-slate-400 hover:text-white rounded-lg"
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
                  <span className="absolute left-3 top-2.5 text-xs font-mono font-bold text-slate-400">
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
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-white font-mono font-bold focus:border-amber-500 focus:outline-none"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Peso Líquido da Embalagem:
                </label>
                <div className="flex rounded-xl overflow-hidden border border-slate-700 bg-slate-800 focus-within:border-amber-500">
                  <input
                    type="number"
                    min="0"
                    step={calcModalUnit === 'g' ? '1' : '0.001'}
                    placeholder={calcModalUnit === 'g' ? 'ex: 500' : 'ex: 1.000'}
                    value={calcModalWeight === '' ? '' : calcModalWeight}
                    onChange={e => {
                      const val = e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0);
                      setCalcModalWeight(val);
                    }}
                    className="flex-1 bg-transparent px-3 py-2 text-sm text-white font-mono font-bold focus:outline-none"
                  />
                  <div className="flex items-center bg-slate-750 p-1 gap-1 border-l border-slate-700">
                    <button
                      type="button"
                      onClick={() => setCalcModalUnit('kg')}
                      className={`px-2 py-1 text-xs font-bold rounded-lg transition-all ${
                        calcModalUnit === 'kg'
                          ? 'bg-amber-500 text-slate-950 font-black'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      kg
                    </button>
                    <button
                      type="button"
                      onClick={() => setCalcModalUnit('g')}
                      className={`px-2 py-1 text-xs font-bold rounded-lg transition-all ${
                        calcModalUnit === 'g'
                          ? 'bg-amber-500 text-slate-950 font-black'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      g
                    </button>
                  </div>
                </div>
              </div>

              {/* Resultado do Custo Calculado */}
              <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Novo Custo por Quilo
                  </span>
                  <span className="text-xs text-slate-400">
                    Atual: <span className="font-mono text-slate-300">R$ {calculatorModalIng.costKg.toFixed(2)}</span>
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black font-mono text-emerald-400 block">
                    R$ {modalComputedCostKg > 0 ? modalComputedCostKg.toFixed(2) : calculatorModalIng.costKg.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-slate-400">/ kg</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
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
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>Aplicar Novo Custo</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
