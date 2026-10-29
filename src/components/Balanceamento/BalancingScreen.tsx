import React, { useState, useEffect, useMemo } from 'react';
import { Recipe, Ingredient, StyleStandard, VariegatoItem, RecipeItem } from '../../types/gelato';
import { calculateBatchAnalysis, DEFAULT_PRICING } from '../../core/calculator';
import { stylesDataMap, db } from '../../db/database';
import { NutrientBars } from './NutrientBars';
import { AllergensBadge } from './AllergensBadge';
import { PostProduction } from './PostProduction';
import { SaveRecipeModal } from './SaveRecipeModal';
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
  Layers
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

  // Real-time calculation analysis
  const analysis = useMemo(() => {
    return calculateBatchAnalysis(items, variegatos, currentStyle, ingredientsMap, DEFAULT_PRICING);
  }, [items, variegatos, currentStyle, ingredientsMap]);

  // Handle recipe change from selector
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

  // Normalize batch to exactly 1000g
  const handleNormalize1000g = () => {
    handleApplyBatchScale(1000);
  };

  // Save changes to current recipe in IndexedDB
  const handleUpdateExisting = async () => {
    if (selectedRecipeId === 'new') return;
    const existing = await db.recipes.get(selectedRecipeId);
    if (!existing) return;

    const updated: Recipe = {
      ...existing,
      name: recipeName.trim(),
      category: targetStyleName,
      targetStyle: targetStyleName,
      ingredients: items,
      variegatos: variegatos,
      totalGrams: analysis.caldaWeight,
      updatedAt: new Date().toISOString()
    };

    await db.recipes.put(updated);
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
      {/* Top Header Card */}
      <div className="bg-slate-800/90 rounded-2xl border border-slate-700 p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Recipe Selection & Title */}
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 uppercase tracking-wider">
                Bancada de Balanceamento
              </span>
              {isDirty && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                  Edições não salvas
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-[280px]">
                <select
                  value={selectedRecipeId}
                  onChange={e => handleSelectRecipe(e.target.value)}
                  className="w-full appearance-none bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 pr-10 text-sm font-semibold text-white focus:outline-none focus:border-amber-500 shadow-inner"
                >
                  <option value="new">✨ Criar Nova Receita Personalizada...</option>
                  <optgroup label="Receitas do Repositório">
                    {recipes.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.category})
                      </option>
                    ))}
                  </optgroup>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3.5 pointer-events-none" />
              </div>

              {/* Editable Name Field */}
              <input
                type="text"
                value={recipeName}
                onChange={e => {
                  setRecipeName(e.target.value);
                  setIsDirty(true);
                }}
                className="flex-1 min-w-[220px] bg-slate-900/60 border border-slate-700 rounded-xl px-3.5 py-2 text-sm font-bold text-amber-200 focus:outline-none focus:border-amber-500 placeholder-slate-500"
                placeholder="Nome da Receita..."
              />

              {/* Target Style Dropdown */}
              <select
                value={targetStyleName}
                onChange={e => {
                  setTargetStyleName(e.target.value);
                  setIsDirty(true);
                }}
                className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:border-amber-500"
              >
                {Object.keys(stylesDataMap).map(s => (
                  <option key={s} value={s}>
                    Estilo: {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="px-3.5 py-2 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700/50 text-xs font-medium transition-colors flex items-center gap-1.5"
              title="Reverter alterações e voltar à receita original"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reverter</span>
            </button>

            <button
              type="button"
              onClick={() => setIsSaveModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/25 transition-all flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Receita</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="px-3 py-2 rounded-xl border border-slate-700 bg-slate-900/80 text-slate-300 hover:text-white text-xs font-medium transition-colors flex items-center gap-1.5"
              title="Imprimir Ficha Técnica de Produção"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Imprimir</span>
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
          <div className="bg-slate-800/90 rounded-2xl border border-slate-700 p-4 shadow-xl space-y-4">
            {/* Table Header Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Composição da Calda Base</h3>
                <span className="text-xs text-slate-400">({items.length} ingredientes)</span>
              </div>

              {/* Batch Scale Controls */}
              <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-xl border border-slate-700">
                <span className="text-[11px] font-medium text-slate-400 pl-2">Escalar Batelada:</span>
                <input
                  type="number"
                  min="100"
                  step="50"
                  value={batchScaleInput}
                  onChange={e => setBatchScaleInput(e.target.value)}
                  className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-right font-mono text-white focus:outline-none focus:border-amber-500"
                />
                <span className="text-xs text-slate-400 font-mono">g</span>
                <button
                  type="button"
                  onClick={() => handleApplyBatchScale(parseFloat(batchScaleInput) || 1000)}
                  className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-colors flex items-center gap-1"
                  title="Recalcular gramagens proporcionalmente"
                >
                  <Scale className="w-3 h-3" />
                  <span>Aplicar</span>
                </button>
                <button
                  type="button"
                  onClick={handleNormalize1000g}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg text-[11px] transition-colors"
                  title="Converter proporções para padrão 1.000g"
                >
                  1kg Base
                </button>
              </div>
            </div>

            {/* Ingredients Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-700/80 font-semibold">
                    <th className="py-2.5 pl-2">Ingrediente</th>
                    <th className="py-2.5 text-right w-28">Peso (g)</th>
                    <th className="py-2.5 text-right w-20">% Calda</th>
                    <th className="py-2.5 text-right w-24">Custo R$</th>
                    <th className="py-2.5 text-center w-12">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/40">
                  {items.map((item, idx) => {
                    const ing = ingredientsMap.get(item.name.toLowerCase().trim());
                    const pct = analysis.caldaWeight > 0 ? (item.grams / analysis.caldaWeight) * 100 : 0;
                    const itemCost = ing ? (item.grams * ing.costKg) / 1000 : 0;

                    return (
                      <tr key={idx} className="hover:bg-slate-750/50 transition-colors group">
                        <td className="py-2 pl-2">
                          <input
                            type="text"
                            list="ingredients-datalist"
                            value={item.name}
                            onChange={e => handleNameChange(idx, e.target.value)}
                            placeholder="Digite ou escolha o insumo..."
                            className="w-full bg-slate-900/80 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 font-medium"
                          />
                        </td>
                        <td className="py-2 text-right">
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={item.grams || ''}
                            onChange={e => handleGramsChange(idx, parseFloat(e.target.value) || 0)}
                            className="w-24 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-right font-mono font-bold text-amber-300 focus:outline-none focus:border-amber-500"
                          />
                        </td>
                        <td className="py-2 text-right font-mono text-slate-300">
                          {pct.toFixed(1)}%
                        </td>
                        <td className="py-2 text-right font-mono text-slate-300">
                          R$ {itemCost.toFixed(2)}
                        </td>
                        <td className="py-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveRow(idx)}
                            className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                            title="Remover Ingrediente"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-700 font-bold text-white text-xs">
                    <td className="py-3 pl-2">Total Calda Base</td>
                    <td className="py-3 text-right font-mono text-amber-400">
                      {Math.round(analysis.caldaWeight)} g
                    </td>
                    <td className="py-3 text-right font-mono text-slate-300">100.0%</td>
                    <td className="py-3 text-right font-mono text-emerald-400">
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
                className="w-full py-2.5 border border-dashed border-slate-700 hover:border-amber-500/60 rounded-xl text-xs font-semibold text-slate-300 hover:text-amber-300 hover:bg-amber-500/5 transition-all flex items-center justify-center gap-1.5"
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
          <div className="bg-slate-800/90 rounded-2xl border border-slate-700 p-5 shadow-xl space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-700 pb-3">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Engenharia de Custos & Precificação</h3>
            </div>

            {/* KPI Cards */}
            <div className="space-y-3">
              <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-700/80 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block">Custo Calda Base</span>
                  <span className="text-lg font-extrabold text-white font-mono">
                    R$ {analysis.costing.caldaCostKg.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-slate-500 block">por kg</span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Peso Total Calda</span>
                  <span className="text-sm font-bold text-amber-300 font-mono">
                    {Math.round(analysis.caldaWeight)} g
                  </span>
                </div>
              </div>

              {variegatos.length > 0 && (
                <div className="bg-amber-500/10 p-3.5 rounded-xl border border-amber-500/30 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-amber-300 block">Custo Final c/ Mesclas</span>
                    <span className="text-lg font-extrabold text-amber-200 font-mono">
                      R$ {analysis.costing.finalCostKg.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-amber-400/80 block">por kg</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-amber-300 block">Mescla no Total</span>
                    <span className="text-sm font-bold text-amber-200 font-mono">
                      {analysis.costing.variegatoRatioPercent}%
                    </span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700">
                  <span className="text-[11px] text-slate-400 block">Custo Bola 60g</span>
                  <span className="text-base font-extrabold text-white font-mono">
                    R$ {analysis.costing.scoopCost60g.toFixed(2)}
                  </span>
                </div>

                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700">
                  <span className="text-[11px] text-slate-400 block">Custo Batelada</span>
                  <span className="text-base font-extrabold text-white font-mono">
                    R$ {analysis.costing.totalBatchCost.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-950/40 to-slate-900 border border-emerald-800/40">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-emerald-300">
                    Preço Sugerido (Pote 500g)
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                    Markup 40%
                  </span>
                </div>
                <div className="text-2xl font-black text-emerald-400 font-mono mb-1">
                  R$ {analysis.costing.suggestedPrice500g.toFixed(2)}
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Inclui R$ 1,50 de pote + R$ 5,40 de rateio de custos fixos, taxa de cartão (33%) e margem líquida de 40%.
                </p>
              </div>
            </div>

            {/* Quick tips */}
            <div className="text-[11px] text-slate-400 space-y-1.5 pt-2 border-t border-slate-700">
              <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Dica de Vitrine:</span>
              </div>
              <p>
                Para servir na mesma vitrine com sorbets e cremes, mantenha o PAC entre 240 e 280 para garantir consistência idêntica na espátula.
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
