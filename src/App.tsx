import { useState, useEffect } from 'react';
import { db } from './db/database';
import { applyTheme, initThemeListener } from './core/theme';
import { Recipe, Ingredient, Preparation } from './types/gelato';
import { Navbar, NavTab } from './components/Navbar';
import { BalancingScreen } from './components/Balanceamento/BalancingScreen';
import { RecipeList } from './components/Receitas/RecipeList';
import { IngredientManager } from './components/Ingredientes/IngredientManager';
import { PrePreparosList } from './components/PrePreparos/PrePreparosList';
import { PricingCalculator } from './components/Financeiro/PricingCalculator';
import { ImportExportModal } from './components/ImportExport/ImportExportModal';

import initialIngredients from './data/ingredients.json';
import initialRecipes from './data/recipes.json';
import initialPreparations from './data/preparations.json';

const STORAGE_TAB_KEY = 'gelato_active_tab';
const STORAGE_RECIPE_KEY = 'gelato_active_recipe_id';
const VALID_TABS: NavTab[] = ['balanceamento', 'receitas', 'ingredientes', 'preparos', 'financeiro'];

const getInitialTab = (): NavTab => {
  if (typeof window !== 'undefined') {
    // 1. Prioridade: hash na URL (ex: #receitas, #ingredientes)
    const hash = window.location.hash.replace('#', '') as NavTab;
    if (VALID_TABS.includes(hash)) {
      return hash;
    }
    // 2. LocalStorage para restaurar a aba onde o usuário estava ao dar F5
    try {
      const stored = localStorage.getItem(STORAGE_TAB_KEY) as NavTab;
      if (VALID_TABS.includes(stored)) {
        return stored;
      }
    } catch (e) {
      console.warn('Erro ao ler aba ativa do localStorage:', e);
    }
  }
  return 'balanceamento';
};

const getInitialRecipeId = (): string => {
  if (typeof window !== 'undefined') {
    try {
      return localStorage.getItem(STORAGE_RECIPE_KEY) || '';
    } catch {}
  }
  return '';
};

export function App() {
  const [activeTab, setActiveTab] = useState<NavTab>(getInitialTab);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [preparations, setPreparations] = useState<Preparation[]>([]);
  const [activeRecipeId, setActiveRecipeId] = useState<string>(getInitialRecipeId);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load data from IndexedDB with bullet-proof fallback
  const refreshData = async () => {
    try {
      await db.initializeSeedData();
      const recs = await db.recipes.toArray();
      const ings = await db.ingredients.toArray();
      const preps = await db.preparations.toArray();

      const finalRecs = recs && recs.length > 0 ? recs : (initialRecipes as Recipe[]);
      const finalIngs = ings && ings.length > 0 ? ings : (initialIngredients as Ingredient[]);
      const finalPreps = preps && preps.length > 0 ? preps : (initialPreparations as Preparation[]);

      setRecipes(finalRecs);
      setIngredients(finalIngs);
      setPreparations(finalPreps);

      // Restaurar receita ativa previamente salva ou primeira do catálogo
      const savedRecId = getInitialRecipeId();
      const hasSavedRec = savedRecId && finalRecs.some(r => r.id === savedRecId);
      if (!activeRecipeId && finalRecs.length > 0) {
        setActiveRecipeId(hasSavedRec ? savedRecId : finalRecs[0].id);
      }
    } catch (err) {
      console.error('Falha ao carregar do IndexedDB, ativando base de segurança em memória:', err);
      const fallbackRecs = initialRecipes as Recipe[];
      const fallbackIngs = initialIngredients as Ingredient[];
      const fallbackPreps = initialPreparations as Preparation[];

      setRecipes(fallbackRecs);
      setIngredients(fallbackIngs);
      setPreparations(fallbackPreps);

      if (!activeRecipeId && fallbackRecs.length > 0) {
        setActiveRecipeId(fallbackRecs[0].id);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (tab: NavTab) => {
    setActiveTab(tab);
    try {
      localStorage.setItem(STORAGE_TAB_KEY, tab);
      window.location.hash = tab;
    } catch (e) {
      console.warn('Erro ao salvar aba ativa:', e);
    }
  };

  useEffect(() => {
    applyTheme();
    initThemeListener();
    refreshData();

    // Sincronizar caso o usuário use navegação por hash ou histórico
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') as NavTab;
      if (VALID_TABS.includes(hash)) {
        setActiveTab(hash);
        localStorage.setItem(STORAGE_TAB_KEY, hash);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleSelectRecipeFromCatalog = (id: string) => {
    setActiveRecipeId(id);
    try {
      localStorage.setItem(STORAGE_RECIPE_KEY, id);
    } catch {}
    handleTabChange('balanceamento');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="text-4xl mb-4 animate-bounce">🍨</div>
        <h2 className="text-lg font-bold text-white mb-1">Carregando Gelato Balancer...</h2>
        <p className="text-xs text-slate-400">Preparando banco de dados bromatológico offline...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      <Navbar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onOpenBackup={() => setIsBackupModalOpen(true)}
      />

      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        {activeTab === 'balanceamento' && (
          <BalancingScreen
            recipes={recipes}
            ingredients={ingredients}
            initialRecipeId={activeRecipeId}
            onRecipeSaved={refreshData}
          />
        )}

        {activeTab === 'receitas' && (
          <RecipeList
            recipes={recipes}
            onSelectRecipe={handleSelectRecipeFromCatalog}
            onRefresh={refreshData}
          />
        )}

        {activeTab === 'ingredientes' && (
          <IngredientManager
            ingredients={ingredients}
            onRefresh={refreshData}
          />
        )}

        {activeTab === 'preparos' && (
          <PrePreparosList
            preparations={preparations}
            availableIngredients={ingredients}
            onRefresh={refreshData}
          />
        )}

        {activeTab === 'financeiro' && <PricingCalculator />}
      </main>

      {/* Backup and Import/Export Modal */}
      <ImportExportModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        onDataChanged={refreshData}
      />
    </div>
  );
}

export default App;
