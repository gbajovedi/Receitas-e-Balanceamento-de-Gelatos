import React, { useState, useEffect, useMemo } from 'react';
import { Recipe, Ingredient, StyleStandard, VariegatoItem, RecipeItem } from '../../types/gelato';
import { calculateBatchAnalysis } from '../../core/calculator';
import { getStoredPricingParams, getPricingSettings, PRICING_UPDATED_EVENT, PricingParams } from '../../core/pricingStorage';
import { stylesDataMap, db } from '../../db/database';
import { NutrientBars } from './NutrientBars';
import { AllergensBadge } from './AllergensBadge';
import { PostProduction } from './PostProduction';
import { SaveRecipeModal } from './SaveRecipeModal';
import { RecipeSearchCombobox } from './RecipeSearchCombobox';
import { CategoryBadge, getCategoryTheme } from '../../core/categoryThemes';
import {
  Save,
  Plus,
  Trash2,
  RotateCcw,
  Scale,
  Printer,
  ChevronDown,
  Sparkles,
  DollarSign,
  Layers,
  ChefHat,
  X
} from 'lucide-react';

interface BalancingScreenProps {
  recipes: Recipe[];
  ingredients: Ingredient[];
  initialRecipeId?: string;
  onRecipeSaved: () => void;
}

export const BalancingScreen: React.FC<BalancingScreenProps> = ({
  recipes,
  ingredients,
  initialRecipeId,
  onRecipeSaved
}) => {
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>(initialRecipeId || (recipes[0]?.id ?? ''));
  const [recipeName, setRecipeName] = useState<string>('Receita sem título');
  const [targetStyleName, setTargetStyleName] = useState<string>('Gelatos de Leite');
  const [items, setItems] = useState<RecipeItem[]>([]);
  const [variegatos, setVariegatos] = useState<VariegatoItem[]>([]);
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState<boolean>(false);
  const [batchScaleInput, setBatchScaleInput] = useState<string>('1000');
  const [lastActiveRecipeId, setLastActiveRecipeId] = useState<string>(initialRecipeId || (recipes[0]?.id ?? ''));

  // Map of ingredients by lowercase name for fast lookup
  const ingredientsMap = useMemo(() => {
    const map = new Map<string, Ingredient>();
    for (const ing of ingredients) {
      map.set(ing.name.toLowerCase().trim(), ing);
    }
    return map;
  }, [ingredients]);

  // Load recipe into editor
  const loadRecipe = (rec: Recipe) => {
    setSelectedRecipeId(rec.id);
    if (rec.id !== 'new') { setLastActiveRecipeId(rec.id); try { localStorage.setItem('gelato_active_recipe_id', rec.id); } catch {} }
    setRecipeName(rec.name);
    setTargetStyleName(rec.targetStyle || rec.category || 'Gelatos de Leite');
    setItems(rec.ingredients ? JSON.parse(JSON.stringify(rec.ingredients)) : []);
    setVariegatos(rec.variegatos ? JSON.parse(JSON.stringify(rec.variegatos)) : []);
    const totalG = rec.ingredients ? rec.ingredients.reduce((acc, i) => acc + i.grams, 0) : 1000;
    setBatchScaleInput(String(Math.round(totalG)));
    setIsDirty(false);
  };

  useEffect(() => {
    if (initialRecipeId) {
      const found = recipes.find(r => r.id === initialRecipeId);
      if (found) loadRecipe(found);
    } else if (recipes.length > 0 && items.length === 0) {
      loadRecipe(recipes[0]);
    }
  }, [initialRecipeId, recipes]);

  const currentStyle: StyleStandard = useMemo(() => {
    return stylesDataMap[targetStyleName] || stylesDataMap['Gelatos de Leite'];
  }, [targetStyleName]);

  // Sincronização em tempo real com os parâmetros da aba Precificação
  const [pricingParams, setPricingParams] = useState<PricingParams>(getStoredPricingParams);

  useEffect(() => {
    const handlePricingUpdate = () => {
      setPricingParams(getStoredPricingParams());
    };
    window.addEventListener(PRICING_UPDATED_EVENT, handlePricingUpdate);
    window.addEventListener('storage', handlePricingUpdate);
    return () => {
      window.removeEventListener(PRICING_UPDATED_EVENT, handlePricingUpdate);
      window.removeEventListener('storage', handlePricingUpdate);
    };
  }, []);

  const pricingSettings = useMemo(() => getPricingSettings(pricingParams), [pricingParams]);

  // Real-time calculation analysis usando as regras da aba de Precificação
  const analysis = useMemo(() => {
    return calculateBatchAnalysis(items, variegatos, currentStyle, ingredientsMap, pricingSettings);
  }, [items, variegatos, currentStyle, ingredientsMap, pricingSettings]);

  // Handle recipe change from selector
  const handleStartNewRecipe = () => {
    if (selectedRecipeId !== 'new') {
      setLastActiveRecipeId(selectedRecipeId);
    }
    handleSelectRecipe('new');
  };

  const handleCancelNewRecipe = () => {
    if (isDirty) {
      const confirmCancel = window.confirm(
        'Deseja cancelar o cadastro desta nova receita e voltar à bancada normal? Quaisquer alterações não salvas serão descartadas.'
      );
      if (!confirmCancel) return;
    }

    const fallbackId = lastActiveRecipeId && lastActiveRecipeId !== 'new' ? lastActiveRecipeId : recipes[0]?.id;
    const rec = recipes.find(r => r.id === fallbackId) || recipes[0];
    if (rec) {
      loadRecipe(rec);
    }
  };

  const handleSelectRecipe = (id: string) => {
    if (id === 'new') {
      setSelectedRecipeId('new');
      setRecipeName('Novo Gelato Artesanal');
      setTargetStyleName('Gelatos de Leite');
      setItems([
        { name: 'Leite Integral', grams: 620 },
        { name: 'Creme De Leite Fresco 35%', grams: 150 },
        { name: 'Leite Em Pó Desnatado', grams: 45 },
        { name: 'Açúcar Sacarose', grams: 120 },
        { name: 'Açúcar - Dextrose', grams: 35 },
        { name: 'Neutro Fabbri', grams: 5 }
      ]);
      setVariegatos([]);
      setBatchScaleInput('975');
      setIsDirty(true);
      return;
    }

    const rec = recipes.find(r => r.id === id);
    if (rec) loadRecipe(rec);
  };

  // Modify row grammage
  const handleGramsChange = (index: number, newGrams: number) => {
    const next = [...items];
    next[index] = { ...next[index], grams: Math.max(0, newGrams) };
    setItems(next);
    setIsDirty(true);
  };

  // Modify row ingredient name
  const handleNameChange = (index: number, newName: string) => {
    const next = [...items];
    next[index] = { ...next[index], name: newName };
    setItems(next);
    setIsDirty(true);
  };

  // Add new ingredient row
  const handleAddRow = () => {
    setItems([...items, { name: '', grams: 50 }]);
    setIsDirty(true);
  };

  // Remove row
  const handleRemoveRow = (index: number) => {
    const next = [...items];
    next.splice(index, 1);
    setItems(next);
    setIsDirty(true);
  };

  // Scale entire batch proportionally
  const handleApplyBatchScale = (targetGrams: number) => {
    if (analysis.caldaWeight <= 0 || targetGrams <= 0) return;
    const ratio = targetGrams / analysis.caldaWeight;

    const scaledItems = items.map(i => ({
      ...i,
      grams: Math.round(i.grams * ratio * 10) / 10
    }));

    const scaledVariegatos = variegatos.map(v => ({
      ...v,
      grams: Math.round(v.grams * ratio * 10) / 10
    }));

    setItems(scaledItems);
    setVariegatos(scaledVariegatos);
    setBatchScaleInput(String(targetGrams));
    setIsDirty(true);
  };

  // Save changes to current recipe in IndexedDB
  const handleUpdateExisting = async (updatedName?: string, updatedCategory?: string, updatedNotes?: string) => {
    if (selectedRecipeId === 'new') return;
    const existing = await db.recipes.get(selectedRecipeId);
    if (!existing) return;

    const finalName = updatedName?.trim() || recipeName.trim();
    const finalCategory = updatedCategory?.trim() || targetStyleName;

    const updated: Recipe = {
      ...existing,
      name: finalName,
      category: finalCategory,
      targetStyle: finalCategory,
      notes: updatedNotes !== undefined ? updatedNotes : existing.notes,
      ingredients: items,
      variegatos: variegatos,
      totalGrams: analysis.caldaWeight,
      updatedAt: new Date().toISOString()
    };

    await db.recipes.put(updated);
    setRecipeName(finalName);
    setIsDirty(false);
    onRecipeSaved();
  };

  // Save as new custom recipe
  const handleSaveAsNew = async (name: string, category: string, notes: string) => {
    const newId = `custom_${Date.now()}`;
    const newRecipe: Recipe = {
      id: newId,
      name,
      category,
      targetStyle: category,
      ingredients: items,
      variegatos: variegatos,
      totalGrams: analysis.caldaWeight,
      isCustom: true,
      notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await db.recipes.put(newRecipe);
    setSelectedRecipeId(newId);
    setRecipeName(name);
    setIsDirty(false);
    onRecipeSaved();
  };

  // Restore active recipe to original
  const handleReset = () => {
    const rec = recipes.find(r => r.id === selectedRecipeId);
    if (rec) loadRecipe(rec);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Header Card (z-30 so search combobox dropdown floats above subsequent cards without clipping) */}
      <div className="relative z-30 bg-slate-800/95 rounded-2xl border border-slate-700/80 p-5 shadow-xl">
        {/* Dynamic Category Accent Line */}
        <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-gradient-to-r ${getCategoryTheme(targetStyleName).gradient}`} />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Recipe Selection & Title */}
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/40 uppercase tracking-wider flex items-center gap-1.5">
                <ChefHat className="w-3.5 h-3.5" />
                Bancada de Balanceamento
              </span>
              {selectedRecipeId === 'new' ? (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5 animate-pulse">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Cadastrando Nova Receita
                </span>
              ) : isDirty ? (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  Edições ativas na bancada
                </span>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <RecipeSearchCombobox
                recipes={recipes}
                selectedRecipeId={selectedRecipeId}
                onSelectRecipe={handleSelectRecipe}
              />

              {/* Editable Name Field */}
              <input
                type="text"
                value={recipeName}
                onChange={e => {
                  setRecipeName(e.target.value);
                  setIsDirty(true);
                }}
                className="flex-1 min-w-[240px] bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-2.5 text-base font-bold text-amber-300 focus:outline-none focus:border-amber-500 placeholder-slate-500"
                placeholder="Nome da Receita..."
              />

              {/* Target Style Dropdown with matching CategoryBadge */}
              <div className="flex items-center gap-2">
                <CategoryBadge category={targetStyleName} className="hidden sm:inline-flex" />
                <select
                  value={targetStyleName}
                  onChange={e => {
                    setTargetStyleName(e.target.value);
                    setIsDirty(true);
                  }}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  {Object.keys(stylesDataMap).map(s => (
                    <option key={s} value={s}>
                      Estilo: {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {selectedRecipeId === 'new' ? (
              <button
                type="button"
                onClick={handleCancelNewRecipe}
                className="px-4 py-2.5 rounded-xl border border-rose-500/40 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 hover:text-white text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 active:scale-95 shadow-sm"
                title="Cancelar criação da nova receita e voltar à receita anterior"
              >
                <X className="w-4 h-4 text-rose-400" />
                <span>Cancelar / Voltar</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStartNewRecipe}
                className="px-4 py-2.5 rounded-xl border border-amber-500/40 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 hover:text-white text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 active:scale-95 shadow-sm"
                title="Criar uma nova receita personalizada a partir do zero"
              >
                <Plus className="w-4 h-4 text-amber-400" />
                <span>Nova Receita</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleReset}
              disabled={selectedRecipeId === 'new'}
              className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700/60 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold transition-colors flex items-center gap-1.5"
              title="Reverter alterações e voltar à receita original"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reverter</span>
            </button>

            <button
              type="button"
              onClick={() => setIsSaveModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/25 transition-all flex items-center gap-2 active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Receita</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-900/80 text-slate-300 hover:text-white text-xs font-bold transition-colors flex items-center gap-1.5"
              title="Imprimir Ficha Técnica de Produção"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Imprimir Ficha</span>
            </button>
          </div>
        </div>
      </div>

      {/* Real-time Nutrient Gauges */}
      <NutrientBars analysis={analysis} />

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Ingredients Table (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-slate-800/90 rounded-2xl border border-slate-700/80 p-5 shadow-xl space-y-4">
            {/* Table Header Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Composição da Calda Base</h3>
                <span className="text-xs font-medium text-slate-400">({items.length} ingredientes)</span>
              </div>

              {/* Batch Scale Controls with Quick-Pills */}
              <div className="flex flex-wrap items-center gap-2 bg-slate-900/90 p-2 rounded-xl border border-slate-700">
                <span className="text-xs font-bold text-slate-300 pl-1">Batelada:</span>
                <input
                  type="number"
                  min="100"
                  step="50"
                  value={batchScaleInput}
                  onChange={e => setBatchScaleInput(e.target.value)}
                  className="w-24 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm text-right font-mono font-black text-amber-300 focus:outline-none focus:border-amber-500"
                />
                <span className="text-xs text-slate-400 font-mono font-bold">g</span>
                <button
                  type="button"
                  onClick={() => handleApplyBatchScale(parseFloat(batchScaleInput) || 1000)}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg text-xs transition-colors flex items-center gap-1 shadow-sm"
                  title="Recalcular gramagens proporcionalmente"
                >
                  <Scale className="w-3.5 h-3.5" />
                  <span>Escalar</span>
                </button>

                {/* Quick scale shortcut buttons */}
                <div className="flex items-center gap-1 border-l border-slate-700 pl-1.5 ml-0.5">
                  {[1000, 2500, 3000].map(weight => (
                    <button
                      key={weight}
                      type="button"
                      onClick={() => handleApplyBatchScale(weight)}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-mono font-bold rounded text-xs transition-colors"
                      title={`Escalar para ${weight}g`}
                    >
                      {weight / 1000}kg
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Ingredients Table with readable font sizes */}
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-700 text-xs uppercase tracking-wider font-bold">
                    <th className="py-3 pl-2">Ingrediente / Matéria-Prima</th>
                    <th className="py-3 text-right w-32">Peso (g)</th>
                    <th className="py-3 text-right w-24">% Calda</th>
                    <th className="py-3 text-right w-28">Custo R$</th>
                    <th className="py-3 text-center w-12">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {items.map((item, idx) => {
                    const ing = ingredientsMap.get(item.name.toLowerCase().trim());
                    const pct = analysis.caldaWeight > 0 ? (item.grams / analysis.caldaWeight) * 100 : 0;
                    const itemCost = ing ? (item.grams * ing.costKg) / 1000 : 0;

                    return (
                      <tr key={idx} className="hover:bg-slate-750/40 transition-colors group">
                        <td className="py-2.5 pl-2">
                          <input
                            type="text"
                            list="ingredients-datalist"
                            value={item.name}
                            onChange={e => handleNameChange(idx, e.target.value)}
                            placeholder="Digite ou escolha o insumo..."
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 font-semibold"
                          />
                        </td>
                        <td className="py-2.5 text-right">
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={item.grams || ''}
                            onChange={e => handleGramsChange(idx, parseFloat(e.target.value) || 0)}
                            className="w-28 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-right font-mono font-black text-amber-300 focus:outline-none focus:border-amber-500"
                          />
                        </td>
                        <td className="py-2.5 text-right font-mono font-bold text-slate-200 text-sm">
                          {pct.toFixed(1)}%
                        </td>
                        <td className="py-2.5 text-right font-mono font-bold text-slate-200 text-sm">
                          R$ {itemCost.toFixed(2)}
                        </td>
                        <td className="py-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveRow(idx)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/15 rounded-lg transition-colors"
                            title="Remover Ingrediente"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-600 font-black text-white text-sm">
                    <td className="py-3.5 pl-2 text-base">Total Calda Base</td>
                    <td className="py-3.5 text-right font-mono text-amber-300 text-base">
                      {Math.round(analysis.caldaWeight)} g
                    </td>
                    <td className="py-3.5 text-right font-mono text-slate-300">100.0%</td>
                    <td className="py-3.5 text-right font-mono text-emerald-400 text-base">
                      R$ {analysis.totals.cost.toFixed(2)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Add Row Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleAddRow}
                className="w-full py-3 border-2 border-dashed border-slate-700 hover:border-amber-500/70 rounded-xl text-xs sm:text-sm font-bold text-slate-300 hover:text-amber-300 hover:bg-amber-500/10 transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar Novo Insumo na Calda</span>
              </button>
            </div>
          </div>

          {/* Variegatos & Inclusions Module */}
          <PostProduction
            variegatos={variegatos}
            availableIngredients={ingredients}
            onUpdateVariegatos={v => {
              setVariegatos(v);
              setIsDirty(true);
            }}
          />

          {/* Allergens Regulation Badge */}
          <AllergensBadge allergensLabel={analysis.allergensLabel} />
        </div>

        {/* Right Column: Financial & Yield Summary (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-800/90 rounded-2xl border border-slate-700/80 p-5 shadow-xl space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-700 pb-3">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white">Engenharia de Custos</h3>
            </div>

            {/* KPI Cards with Punchy Numbers */}
            <div className="space-y-3">
              <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-700 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    Custo Calda Base
                  </span>
                  <span className="text-2xl font-black text-white font-mono">
                    R$ {analysis.costing.caldaCostKg.toFixed(2)}
                  </span>
                  <span className="text-xs text-slate-400 block font-medium">por kg de calda</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    Peso Calda
                  </span>
                  <span className="text-lg font-black text-amber-300 font-mono">
                    {Math.round(analysis.caldaWeight)} g
                  </span>
                </div>
              </div>

              {variegatos.length > 0 && (
                <div className="bg-amber-500/15 p-4 rounded-xl border border-amber-500/40 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-300 block mb-0.5">
                      Custo Final c/ Mesclas
                    </span>
                    <span className="text-2xl font-black text-amber-200 font-mono">
                      R$ {analysis.costing.finalCostKg.toFixed(2)}
                    </span>
                    <span className="text-xs text-amber-300/80 block font-medium">por kg produto final</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-300 block mb-0.5">
                      Mescla no Total
                    </span>
                    <span className="text-lg font-black text-amber-200 font-mono">
                      {analysis.costing.variegatoRatioPercent}%
                    </span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-slate-900/70 p-3.5 rounded-xl border border-slate-700">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Bola (60g)
                  </span>
                  <span className="text-xl font-black text-white font-mono">
                    R$ {analysis.costing.scoopCost60g.toFixed(2)}
                  </span>
                </div>

                <div className="bg-slate-900/70 p-3.5 rounded-xl border border-slate-700">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Custo Batelada
                  </span>
                  <span className="text-xl font-black text-white font-mono">
                    R$ {analysis.costing.totalBatchCost.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-950/60 to-slate-900 border border-emerald-700/50 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                    Preço Sugerido (Pote {pricingParams.tubWeightGrams}g)
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/25 text-emerald-300 font-bold border border-emerald-500/40">
                    Margem {pricingParams.targetMargin}%
                  </span>
                </div>
                <div className="text-3xl font-black text-emerald-400 font-mono tracking-tight">
                  R$ {analysis.costing.suggestedPrice500g.toFixed(2)}
                </div>
                <div className="text-[11px] text-slate-300 leading-relaxed pt-2 border-t border-emerald-900/60 space-y-1">
                  <p>
                    <strong>Markup sincronizado:</strong> R$ {pricingParams.tubPackCost.toFixed(2)} embalagem + R$ {pricingSettings.indirectOverheadPerTub.toFixed(2)} rateio fixo (inclui MEI), taxa de maquininha ({pricingSettings.cardFeePercent.toFixed(2)}%), impostos ({pricingParams.salesTaxPercent}%) e lucro de {pricingParams.targetMargin}%.
                  </p>
                  <p className="text-slate-400 text-[10px]">
                    Sincronizado automaticamente com os custos e taxas da aba <strong>Precificação</strong>.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick tips */}
            <div className="text-xs text-slate-300 space-y-1.5 pt-3 border-t border-slate-700">
              <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Dica do Mestre Gelatiere:</span>
              </div>
              <p className="leading-relaxed">
                Para servir na mesma vitrine com sorbets e cremes, mantenha o PAC entre <strong>240 e 280</strong> para garantir textura homogênea e firmeza de espátula idêntica em todas as cubas.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Datalist for fast ingredient autocompletion */}
      <datalist id="ingredients-datalist">
        {ingredients.map(ing => (
          <option key={ing.id} value={ing.name}>
            {ing.category} (R$ {ing.costKg.toFixed(2)}/kg)
          </option>
        ))}
      </datalist>

      {/* Save Modal */}
      <SaveRecipeModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        currentName={recipeName}
        currentCategory={targetStyleName}
        isExisting={selectedRecipeId !== 'new'}
        onUpdateExisting={handleUpdateExisting}
        onSaveAsNew={handleSaveAsNew}
      />
    </div>
  );
};
