import React, { useState, useEffect, useMemo } from 'react';
import { Recipe, Ingredient } from '../../types/gelato';
import {
  Search,
  Plus,
  Trash2,
  BookOpen,
  Eye,
  X,
  Scale,
  Copy,
  ArrowUpDown,
  Layers,
  AlertCircle,
  CheckCircle2,
  SlidersHorizontal
} from 'lucide-react';
import { db, stylesDataMap } from '../../db/database';
import { calculateBatchAnalysis } from '../../core/calculator';
import { STYLES_UPDATED_EVENT } from '../../core/stylesStorage';
import { RecipeViewerModal } from './RecipeViewerModal';
import { StyleSettingsModal } from '../Balanceamento/StyleSettingsModal';
import { getCategoryTheme, CategoryBadge } from '../../core/categoryThemes';

interface RecipeListProps {
  recipes: Recipe[];
  ingredients?: Ingredient[];
  onSelectRecipe: (id: string) => void;
  onRefresh: () => void;
}

export const RecipeList: React.FC<RecipeListProps> = ({
  recipes,
  ingredients = [],
  onSelectRecipe,
  onRefresh
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [balanceFilter, setBalanceFilter] = useState<'all' | 'balanced' | 'critical'>('all');
  const [sortBy, setSortBy] = useState<'name-asc' | 'custom-first' | 'cost-asc' | 'pac-desc'>('name-asc');
  const [viewingRecipe, setViewingRecipe] = useState<Recipe | null>(null);
  const [isStyleModalOpen, setIsStyleModalOpen] = useState(false);
  const [stylesRevision, setStylesRevision] = useState(0);

  // Reage imediatamente a alterações nas metas físico-químicas
  useEffect(() => {
    const handleStylesUpdate = () => {
      setStylesRevision(prev => prev + 1);
    };
    window.addEventListener(STYLES_UPDATED_EVENT, handleStylesUpdate);
    window.addEventListener('storage', handleStylesUpdate);
    return () => {
      window.removeEventListener(STYLES_UPDATED_EVENT, handleStylesUpdate);
      window.removeEventListener('storage', handleStylesUpdate);
    };
  }, []);

  // Fast ingredient lookup map
  const ingredientsMap = useMemo(() => {
    const map = new Map<string, Ingredient>();
    for (const ing of ingredients) {
      map.set(ing.name.toLowerCase().trim(), ing);
    }
    return map;
  }, [ingredients]);

  // Pre-calculate technical metrics for each recipe
  const metrics = useMemo(() => {
    const map = new Map<
      string,
      {
        pac: number;
        pod: number;
        fatPct: number;
        sugarsPct: number;
        costKg: number;
        totalWeight: number;
        needsAdjustment: boolean;
        unbalanceReasons: string[];
      }
    >();

    for (const recipe of recipes) {
      let totalWeight = 0;
      let cost = 0;

      for (const item of recipe.ingredients || []) {
        totalWeight += item.grams;
        const ing = ingredientsMap.get(item.name.toLowerCase().trim());
        if (ing) {
          cost += (item.grams / 1000) * (ing.costKg || 0);
        }
      }

      for (const v of recipe.variegatos || []) {
        totalWeight += v.grams;
        if (v.costKg) {
          cost += (v.grams / 1000) * v.costKg;
        }
      }

      const costKg = totalWeight > 0 ? cost / (totalWeight / 1000) : 0;

      // Target style standard
      const targetStyleName = recipe.targetStyle || recipe.category || 'Gelatos de Leite';
      const currentStyle = stylesDataMap[targetStyleName] || stylesDataMap['Gelatos de Leite'];

      let pacVal = 0;
      let podVal = 0;
      let fatPct = 0;
      let sugarsPct = 0;
      let needsAdjustment = false;
      const unbalanceReasons: string[] = [];

      if (recipe.ingredients && recipe.ingredients.length > 0 && currentStyle) {
        const analysis = calculateBatchAnalysis(
          recipe.ingredients,
          recipe.variegatos || [],
          currentStyle,
          ingredientsMap
        );

        pacVal = Math.round(analysis.percentages.pac);
        podVal = Math.round(analysis.percentages.pod);
        fatPct = analysis.percentages.fat * 100;
        sugarsPct = analysis.percentages.sugars * 100;

        const isCriticalDeviation = (val: number, min: number, max: number, tol: number) =>
          val < (min - tol) || val > (max + tol);

        const criticalReasons: string[] = [];

        // 1. Risco crítico de arenosidade (Fórmula de Caviezel: SLNG excede teto seguro em > 0.8%)
        const isCriticalSandiness =
          analysis.percentages.msnf > 0.02 &&
          Boolean(analysis.sandinessRisk) &&
          analysis.percentages.msnf > (analysis.sandinessRisk!.maxSafeMsnf + 0.008);

        if (isCriticalSandiness && analysis.sandinessRisk) {
          criticalReasons.push(
            `Risco Crítico de Arenosidade (SLNG ${(analysis.percentages.msnf * 100).toFixed(1)}% > teto seguro ${(analysis.sandinessRisk.maxSafeMsnf * 100).toFixed(1)}%)`
          );
        }

        // 2. PAC crítico (> 20 pontos de desvio do estilo alvo)
        if (isCriticalDeviation(analysis.percentages.pac, currentStyle.min.pac, currentStyle.max.pac, 20)) {
          const status = analysis.percentages.pac < currentStyle.min.pac ? 'muito baixo (congelamento excessivo)' : 'muito alto (fusão rápida)';
          criticalReasons.push(`PAC ${status} (${Math.round(analysis.percentages.pac)} | alvo ${currentStyle.min.pac}–${currentStyle.max.pac})`);
        }

        // 3. Açúcares críticos (> 2.5% de desvio)
        if (isCriticalDeviation(analysis.percentages.sugars, currentStyle.min.sugars, currentStyle.max.sugars, 0.025)) {
          const status = analysis.percentages.sugars < currentStyle.min.sugars ? 'muito baixo' : 'muito alto';
          criticalReasons.push(`Açúcares ${status} (${(analysis.percentages.sugars * 100).toFixed(1)}% | alvo ${Math.round(currentStyle.min.sugars * 100)}–${Math.round(currentStyle.max.sugars * 100)}%)`);
        }

        // 4. Gordura crítica (> 2.0% de desvio)
        if (isCriticalDeviation(analysis.percentages.fat, currentStyle.min.fat, currentStyle.max.fat, 0.02)) {
          const status = analysis.percentages.fat < currentStyle.min.fat ? 'muito baixa' : 'muito alta';
          criticalReasons.push(`Gordura ${status} (${(analysis.percentages.fat * 100).toFixed(1)}% | alvo ${Math.round(currentStyle.min.fat * 100)}–${Math.round(currentStyle.max.fat * 100)}%)`);
        }

        // 5. SLNG crítico (> 1.5% de desvio)
        if (isCriticalDeviation(analysis.percentages.msnf, currentStyle.min.msnf, currentStyle.max.msnf, 0.015)) {
          const status = analysis.percentages.msnf < currentStyle.min.msnf ? 'muito baixo' : 'muito alto';
          criticalReasons.push(`SLNG ${status} (${(analysis.percentages.msnf * 100).toFixed(1)}% | alvo ${Math.round(currentStyle.min.msnf * 100)}–${Math.round(currentStyle.max.msnf * 100)}%)`);
        }

        // 6. Sólidos Totais críticos (> 3.0% de desvio)
        if (isCriticalDeviation(analysis.percentages.totalSolids, currentStyle.min.totalSolids, currentStyle.max.totalSolids, 0.03)) {
          const status = analysis.percentages.totalSolids < currentStyle.min.totalSolids ? 'muito baixo (textura aguada)' : 'muito alto (textura pesada)';
          criticalReasons.push(`Sólidos Totais ${status} (${(analysis.percentages.totalSolids * 100).toFixed(1)}% | alvo ${Math.round(currentStyle.min.totalSolids * 100)}–${Math.round(currentStyle.max.totalSolids * 100)}%)`);
        }

        // 7. POD crítico (> 25 pontos de desvio)
        if (isCriticalDeviation(analysis.percentages.pod, currentStyle.min.pod, currentStyle.max.pod, 25)) {
          const status = analysis.percentages.pod < currentStyle.min.pod ? 'dulçor insuficiente' : 'dulçor excessivo';
          criticalReasons.push(`POD ${status} (${Math.round(analysis.percentages.pod)} | alvo ${currentStyle.min.pod}–${currentStyle.max.pod})`);
        }

        // Somente sinalizar alerta na lista se houver desbalanceamento crítico
        needsAdjustment = criticalReasons.length > 0;
        unbalanceReasons.push(...criticalReasons);
      }

      map.set(recipe.id, {
        pac: pacVal,
        pod: podVal,
        fatPct,
        sugarsPct,
        costKg,
        totalWeight,
        needsAdjustment,
        unbalanceReasons
      });
    }

    return map;
  }, [recipes, ingredientsMap, stylesRevision]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const r of recipes) {
      if (r.category) set.add(r.category);
    }
    return ['Todas', ...Array.from(set)];
  }, [recipes]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { Todas: 0 };
    for (const r of recipes) {
      const matchSearch =
        search === '' ||
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        (r.ingredients && r.ingredients.some(i => i.name.toLowerCase().includes(search.toLowerCase())));
      if (!matchSearch) continue;

      const isCritical = metrics.get(r.id)?.needsAdjustment;
      if (balanceFilter === 'balanced' && isCritical) continue;
      if (balanceFilter === 'critical' && !isCritical) continue;

      counts.Todas = (counts.Todas || 0) + 1;
      if (r.category) {
        counts[r.category] = (counts[r.category] || 0) + 1;
      }
    }
    return counts;
  }, [recipes, search, balanceFilter, metrics]);

  // Contadores contextuais dinâmicos para o Cockpit de Status de Balanceamento
  const balanceStatusCounts = useMemo(() => {
    let all = 0;
    let balanced = 0;
    let critical = 0;

    for (const r of recipes) {
      const matchCat = selectedCategory === 'Todas' || r.category === selectedCategory;
      const matchSearch =
        search === '' ||
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        (r.ingredients && r.ingredients.some(i => i.name.toLowerCase().includes(search.toLowerCase())));
      if (!matchCat || !matchSearch) continue;

      all++;
      if (metrics.get(r.id)?.needsAdjustment) {
        critical++;
      } else {
        balanced++;
      }
    }

    return { all, balanced, critical };
  }, [recipes, selectedCategory, search, metrics]);

  const filteredRecipes = useMemo(() => {
    return recipes.filter(r => {
      const matchCat = selectedCategory === 'Todas' || r.category === selectedCategory;
      const matchSearch =
        search === '' ||
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        (r.ingredients && r.ingredients.some(i => i.name.toLowerCase().includes(search.toLowerCase())));
      if (!matchCat || !matchSearch) return false;

      const isCritical = metrics.get(r.id)?.needsAdjustment;
      if (balanceFilter === 'balanced' && isCritical) return false;
      if (balanceFilter === 'critical' && !isCritical) return false;

      return true;
    });
  }, [recipes, search, selectedCategory, balanceFilter, metrics]);

  const sortedAndFilteredRecipes = useMemo(() => {
    const list = [...filteredRecipes];
    if (sortBy === 'name-asc') {
      list.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    } else if (sortBy === 'custom-first') {
      list.sort((a, b) => (b.isCustom ? 1 : 0) - (a.isCustom ? 1 : 0) || a.name.localeCompare(b.name, 'pt-BR'));
    } else if (sortBy === 'cost-asc') {
      list.sort((a, b) => {
        const costA = metrics.get(a.id)?.costKg || 0;
        const costB = metrics.get(b.id)?.costKg || 0;
        return costA - costB;
      });
    } else if (sortBy === 'pac-desc') {
      list.sort((a, b) => {
        const pacA = metrics.get(a.id)?.pac || 0;
        const pacB = metrics.get(b.id)?.pac || 0;
        return pacB - pacA;
      });
    }
    return list;
  }, [filteredRecipes, sortBy, metrics]);

  const handleDeleteRecipe = async (id: string, name: string) => {
    if (confirm(`Deseja realmente excluir a receita "${name}"? Esta ação removerá a receita do catálogo.`)) {
      await db.recipes.delete(id);
      onRefresh();
    }
  };

  const handleDuplicateRecipe = async (recipe: Recipe) => {
    const newRecipe: Recipe = {
      ...recipe,
      id: 'rec_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      name: `${recipe.name} (Cópia)`,
      isCustom: true
    };
    await db.recipes.add(newRecipe);
    onRefresh();
  };

  return (
    <>
      <div className="no-print space-y-6 max-w-7xl mx-auto pb-16">
        {/* Header & Search */}
        <div className="bg-slate-800/95 rounded-2xl border border-slate-700/80 p-5 shadow-xl space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
                <BookOpen className="w-6 h-6 text-amber-400" />
                <span>Catálogo & Livro de Receitas</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                Toque em qualquer receita para abrir a <strong>Ficha de Produção (Modo Cozinha)</strong> ou clique em{' '}
                <strong>Balancear</strong> para calibrar a fórmula na bancada.
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

          <div className="space-y-3">
            {/* Search bar */}
            <div className="relative w-full">
              <Search className="w-5 h-5 text-amber-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por sabor ou insumo (ex: pistache, chocolate, maracujá, manga)..."
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

            {/* Status de Balanceamento: Cockpit de Ação Rápida (Opção 1) */}
            <div className="flex flex-wrap items-center gap-2 pt-0.5 pb-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                Fórmula:
              </span>
              <div className="inline-flex p-1 bg-slate-900/90 border border-slate-700/80 rounded-2xl gap-1 shadow-inner flex-wrap">
                {/* Todas */}
                <button
                  type="button"
                  onClick={() => setBalanceFilter('all')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    balanceFilter === 'all'
                      ? 'bg-slate-700 text-white shadow-sm font-black'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 text-slate-300" />
                  <span>Todas</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                      balanceFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {balanceStatusCounts.all}
                  </span>
                </button>

                {/* Balanceadas */}
                <button
                  type="button"
                  onClick={() => setBalanceFilter('balanced')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    balanceFilter === 'balanced'
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-black'
                      : 'text-slate-400 hover:text-emerald-300 hover:bg-emerald-500/10'
                  }`}
                >
                  <CheckCircle2
                    className={`w-3.5 h-3.5 ${
                      balanceFilter === 'balanced' ? 'text-slate-950 stroke-[2.6]' : 'text-emerald-400'
                    }`}
                  />
                  <span>Balanceadas</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                      balanceFilter === 'balanced'
                        ? 'bg-emerald-600/35 text-slate-950 font-black'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}
                  >
                    {balanceStatusCounts.balanced}
                  </span>
                </button>

                {/* Precisam de Ajuste */}
                <button
                  type="button"
                  onClick={() => setBalanceFilter('critical')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    balanceFilter === 'critical'
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                      : 'text-slate-400 hover:text-amber-300 hover:bg-amber-500/10'
                  }`}
                >
                  <AlertCircle
                    className={`w-3.5 h-3.5 ${
                      balanceFilter === 'critical' ? 'text-slate-950 stroke-[2.6]' : 'text-amber-400'
                    }`}
                  />
                  <span>Precisam de Ajuste</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                      balanceFilter === 'critical'
                        ? 'bg-amber-600/35 text-slate-950 font-black'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    {balanceStatusCounts.critical}
                  </span>
                </button>
              </div>
            </div>

            {/* Category filter pills with counters and unique icons */}
            <div className="flex flex-wrap items-center gap-2">
              {categories.map(cat => {
                const isSelected = selectedCategory === cat;
                const count = categoryCounts[cat] || 0;
                const catTheme = cat !== 'Todas' ? getCategoryTheme(cat) : null;
                const isDimmed = count === 0 && cat !== 'Todas' && !isSelected;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                        : isDimmed
                        ? 'bg-slate-900/60 border border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700 opacity-60'
                        : 'bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600'
                    }`}
                  >
                    {catTheme ? (
                      <span className={isSelected ? 'text-slate-950' : ''}>
                        {catTheme.icon}
                      </span>
                    ) : (
                      <BookOpen className={`w-3.5 h-3.5 ${isSelected ? 'text-slate-950' : 'text-amber-400'}`} />
                    )}
                    <span>{cat}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                        isSelected
                          ? 'bg-amber-600/30 text-slate-950'
                          : isDimmed
                          ? 'bg-slate-800/50 text-slate-500'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Sub-bar: Results Count & Quick Sort */}
            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-700/60 flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span>
                  Exibindo <strong className="text-amber-400 font-mono font-bold">{sortedAndFilteredRecipes.length}</strong>{' '}
                  de <strong className="text-slate-200 font-mono font-bold">{recipes.length}</strong> receitas
                  {balanceFilter !== 'all' && (
                    <span>
                      {' '}
                      (
                      <strong className={balanceFilter === 'balanced' ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                        {balanceFilter === 'balanced' ? 'Balanceadas' : 'Precisam de Ajuste'}
                      </strong>
                      )
                    </span>
                  )}
                  {selectedCategory !== 'Todas' && (
                    <span>
                      {' '}
                      em <span className="text-white font-bold">{selectedCategory}</span>
                    </span>
                  )}
                </span>

                {(selectedCategory !== 'Todas' || balanceFilter !== 'all' || search) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('Todas');
                      setBalanceFilter('all');
                      setSearch('');
                    }}
                    className="text-[11px] text-amber-400/90 hover:text-amber-300 underline font-semibold ml-2 cursor-pointer transition-colors"
                  >
                    Limpar filtros
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold text-slate-400">Ordenar por:</span>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as any)}
                  className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-2.5 py-1.5 font-bold focus:outline-none focus:border-amber-500 shadow-inner"
                >
                  <option value="name-asc">Nome (A - Z)</option>
                  <option value="custom-first">Personalizadas Primeiro</option>
                  <option value="cost-asc">Menor Custo/kg</option>
                  <option value="pac-desc">Maior PAC (Mais Macio)</option>
                </select>

                <button
                  type="button"
                  onClick={() => setIsStyleModalOpen(true)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-amber-500/50 text-slate-300 hover:text-amber-300 text-xs font-bold transition-all shadow-inner flex items-center gap-1.5 shrink-0 group"
                  title="Configurar metas físico-químicas e limites técnicos dos estilos"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-45 transition-transform" />
                  <span className="hidden sm:inline">Metas Técnicas</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Grid of recipe cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {sortedAndFilteredRecipes.map(recipe => {
            const m = metrics.get(recipe.id);
            const totalWeight = m?.totalWeight ?? (recipe.ingredients ? recipe.ingredients.reduce((a, b) => a + b.grams, 0) : 0);
            const theme = getCategoryTheme(recipe.category);

            return (
              <div
                key={recipe.id}
                className="relative overflow-hidden bg-slate-800/80 hover:bg-slate-800 rounded-2xl border border-slate-700/80 p-5 shadow-lg hover:border-amber-500/50 transition-all flex flex-col justify-between group hover:shadow-amber-500/5 cursor-pointer"
                onClick={() => setViewingRecipe(recipe)}
              >
                {/* Top Category Accent Line */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${theme.gradient}`} />

                <div className="space-y-3.5">
                  {/* Meta Badges (Category & Custom & Variegato & Warning) */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <CategoryBadge category={recipe.category} />

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {recipe.variegatos && recipe.variegatos.length > 0 && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/25 font-bold whitespace-nowrap">
                          🍯 Variegato
                        </span>
                      )}
                      {recipe.isCustom && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold whitespace-nowrap">
                          ✨ Personalizada
                        </span>
                      )}
                      {m?.needsAdjustment && (
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            onSelectRecipe(recipe.id);
                          }}
                          title={
                            m.unbalanceReasons.length > 0
                              ? `Ajuste recomendado na fórmula:\n• ${m.unbalanceReasons.join('\n• ')}\n\nClique para balancear na bancada`
                              : 'Ajuste recomendado na fórmula\n\nClique para balancear na bancada'
                          }
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 hover:border-amber-400 text-amber-400 flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-sm shrink-0"
                          aria-label="Ajuste recomendado na fórmula"
                        >
                          <AlertCircle className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-amber-400 stroke-[2.3]" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Recipe Title: 100% full width, no line-clamp truncation */}
                  <h3
                    className="font-bold text-base sm:text-lg text-white group-hover:text-amber-200 transition-colors leading-snug break-words"
                    title={recipe.name}
                  >
                    {recipe.name}
                  </h3>

                  {/* Micro-Dashboard de Métricas Técnicas */}
                  <div className="grid grid-cols-4 gap-1.5 p-2 bg-slate-900/90 rounded-xl border border-slate-700/70 text-center font-mono shadow-inner">
                    <div
                      className="flex flex-col items-center justify-center py-1 px-0.5 rounded-lg bg-slate-800/70"
                      title="PAC (Poder Anticongelante / Maciez na Vitrine)"
                    >
                      <span className="text-[10px] text-sky-400 font-bold tracking-wider">PAC</span>
                      <span className="text-xs sm:text-sm font-black text-white">{m?.pac ? m.pac : '--'}</span>
                    </div>

                    <div
                      className="flex flex-col items-center justify-center py-1 px-0.5 rounded-lg bg-slate-800/70"
                      title="POD (Poder Adoçante / Doçura Percebida)"
                    >
                      <span className="text-[10px] text-amber-400 font-bold tracking-wider">POD</span>
                      <span className="text-xs sm:text-sm font-black text-white">{m?.pod ? m.pod : '--'}</span>
                    </div>

                    <div
                      className="flex flex-col items-center justify-center py-1 px-0.5 rounded-lg bg-slate-800/70"
                      title="Teor de Gordura Total"
                    >
                      <span className="text-[10px] text-emerald-400 font-bold tracking-wider">GORD.</span>
                      <span className="text-xs sm:text-sm font-black text-white">
                        {m?.fatPct !== undefined && m.fatPct > 0 ? `${m.fatPct.toFixed(1)}%` : '0%'}
                      </span>
                    </div>

                    <div
                      className="flex flex-col items-center justify-center py-1 px-0.5 rounded-lg bg-slate-800/70"
                      title="Custo Base Estimado por Kg"
                    >
                      <span className="text-[10px] text-amber-300 font-bold tracking-wider">CUSTO/KG</span>
                      <span className="text-xs sm:text-sm font-black text-amber-300">
                        {m?.costKg !== undefined && m.costKg > 0 ? `R$${m.costKg.toFixed(1)}` : 'R$--'}
                      </span>
                    </div>
                  </div>

                  {/* Technical metadata */}
                  <div className="flex items-center justify-between text-xs sm:text-sm text-slate-400 font-mono font-medium pt-0.5">
                    <span className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-slate-500" />
                      <span>
                        Insumos: <strong className="text-slate-200">{recipe.ingredients?.length ?? 0}</strong>
                      </span>
                    </span>
                    <span>
                      Peso base: <strong className="text-slate-200">{Math.round(totalWeight)} g</strong>
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
                    className="flex-1 py-2.5 px-3 bg-slate-900 hover:bg-slate-750 text-slate-200 hover:text-white border border-slate-700 font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-sm"
                    title="Abrir ficha técnica de produção e modo cozinha"
                  >
                    <Eye className="w-4 h-4 text-amber-400" />
                    <span>Ver Ficha</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectRecipe(recipe.id)}
                    className="flex-1 py-2.5 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/10 active:scale-95"
                    title="Balancear receita na bancada"
                  >
                    <Scale className="w-4 h-4" />
                    <span>Balancear</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDuplicateRecipe(recipe)}
                    className="p-2.5 shrink-0 text-slate-400 hover:text-amber-300 hover:bg-amber-500/15 rounded-xl transition-colors border border-slate-700 active:scale-95"
                    title={`Duplicar receita "${recipe.name}"`}
                  >
                    <Copy className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteRecipe(recipe.id, recipe.name)}
                    className="p-2.5 shrink-0 text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 rounded-xl transition-colors border border-slate-700 active:scale-95"
                    title="Excluir esta receita do catálogo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {sortedAndFilteredRecipes.length === 0 && (
          <div className="text-center py-16 bg-slate-800/40 rounded-2xl border-2 border-dashed border-slate-700 text-slate-400 text-sm font-medium">
            Nenhuma receita encontrada para os filtros selecionados.
          </div>
        )}
      </div>

      {/* Full-Screen Kitchen Mode Viewer Modal */}
      <RecipeViewerModal
        recipe={viewingRecipe}
        isOpen={!!viewingRecipe}
        onClose={() => setViewingRecipe(null)}
        onOpenInCalculator={onSelectRecipe}
      />

      {/* Modal de Ajuste de Metas Físico-Químicas */}
      <StyleSettingsModal
        isOpen={isStyleModalOpen}
        onClose={() => setIsStyleModalOpen(false)}
        initialStyleName={selectedCategory !== 'Todas' ? selectedCategory : 'Gelatos de Leite'}
        onStyleUpdated={() => {
          setStylesRevision(prev => prev + 1);
        }}
      />
    </>
  );
};
