import { useState, useEffect } from 'react';
import { db } from './db/database';
import { applyTheme } from './core/theme';
import { Recipe, Ingredient, Preparation } from './types/gelato';
import { Navbar, NavTab } from './components/Navbar';
import { BalancingScreen } from './components/Balanceamento/BalancingScreen';
import { RecipeList } from './components/Receitas/RecipeList';
import { IngredientManager } from './components/Ingredientes/IngredientManager';
import { PrePreparosList } from './components/PrePreparos/PrePreparosList';
import { PricingCalculator } from './components/Financeiro/PricingCalculator';
import { ImportExportModal } from './components/ImportExport/ImportExportModal';

export function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('balanceamento');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [preparations, setPreparations] = useState<Preparation[]>([]);
  const [activeRecipeId, setActiveRecipeId] = useState<string>('');
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load data from IndexedDB
  const refreshData = async () => {
    try {
      await db.initializeSeedData();
      const recs = await db.recipes.toArray();
      const ings = await db.ingredients.toArray();
      const preps = await db.preparations.toArray();
      setRecipes(recs);
      setIngredients(ings);
      setPreparations(preps);

      if (!activeRecipeId && recs.length > 0) {
        setActiveRecipeId(recs[0].id);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    applyTheme();
    refreshData();

    // Monitora a transição do pôr do sol a cada minuto
    const timer = setInterval(() => {
      applyTheme();
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const handleSelectRecipeFromCatalog = (id: string) => {
    setActiveRecipeId(id);
    setActiveTab('balanceamento');
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
        onTabChange={setActiveTab}
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
          <PrePreparosList preparations={preparations} />
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
