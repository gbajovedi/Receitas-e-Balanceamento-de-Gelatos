import React from 'react';
import { Scale, BookOpen, Utensils, ChefHat, DollarSign, Database } from 'lucide-react';

export type NavTab = 'balanceamento' | 'receitas' | 'ingredientes' | 'preparos' | 'financeiro';

interface NavbarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onOpenBackup: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onTabChange, onOpenBackup }) => {
  const tabs = [
    { id: 'balanceamento', label: 'Balanceamento', icon: Scale },
    { id: 'receitas', label: 'Livro de Receitas', icon: BookOpen },
    { id: 'ingredientes', label: 'Insumos & Custos', icon: Utensils },
    { id: 'preparos', label: 'Pré-preparos', icon: ChefHat },
    { id: 'financeiro', label: 'Precificação', icon: DollarSign },
  ] as const;

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16 sm:h-20">
        {/* Brand */}
        <div
          onClick={() => onTabChange('balanceamento')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-xl sm:text-2xl shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
            🍨
          </div>
          <div>
            <span className="font-black text-base sm:text-lg tracking-tight text-white block leading-none">
              Gelato<span className="text-amber-400">Balancer</span>
            </span>
            <span className="text-xs text-slate-400 font-mono tracking-wider">
              PWA Artesanal • 100% Offline
            </span>
          </div>
        </div>

        {/* Center Navigation Tabs */}
        <nav className="hidden lg:flex items-center gap-1.5 bg-slate-800/90 p-1.5 rounded-2xl border border-slate-700/80 shadow-inner">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id as NavTab)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-750'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenBackup}
            className="px-3.5 py-2.5 bg-slate-800/90 hover:bg-slate-750 border border-slate-700 hover:border-slate-600 text-slate-200 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center gap-2 shadow-sm active:scale-95"
            title="Importar ou Exportar Dados (.JSON)"
          >
            <Database className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Backup / Dados</span>
          </button>
        </div>
      </div>

      {/* Mobile/Tablet Nav Bar */}
      <div className="flex lg:hidden overflow-x-auto px-4 py-2.5 bg-slate-900 border-t border-slate-800 gap-2">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id as NavTab)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all shrink-0 ${
                isActive
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                  : 'text-slate-300 hover:text-white bg-slate-800/80'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
