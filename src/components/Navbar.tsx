import React from 'react';
import { Scale, BookOpen, Utensils, ChefHat, DollarSign, Database } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

export type NavTab = 'balanceamento' | 'receitas' | 'ingredientes' | 'preparos' | 'financeiro';

interface NavbarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onOpenBackup: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onTabChange, onOpenBackup }) => {
  const tabs = [
    { id: 'balanceamento', label: 'Balanceamento', shortLabel: 'Balanceamento', icon: Scale },
    { id: 'receitas', label: 'Livro de Receitas', shortLabel: 'Receitas', icon: BookOpen },
    { id: 'ingredientes', label: 'Insumos & Custos', shortLabel: 'Insumos', icon: Utensils },
    { id: 'preparos', label: 'Pré-preparos', shortLabel: 'Pré-preparos', icon: ChefHat },
    { id: 'financeiro', label: 'Precificação', shortLabel: 'Precificação', icon: DollarSign },
  ] as const;

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-md w-full">
      <div className="max-w-screen-2xl mx-auto px-3 sm:px-4 lg:px-5 xl:px-6 flex items-center justify-between h-16 sm:h-20 gap-2 sm:gap-3 xl:gap-4 w-full">
        {/* Brand */}
        <div
          onClick={() => onTabChange('balanceamento')}
          className="flex items-center gap-2 sm:gap-2.5 xl:gap-3 cursor-pointer group shrink-0"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 xl:w-11 xl:h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-lg sm:text-xl xl:text-2xl shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform shrink-0">
            🍨
          </div>
          <div className="shrink-0">
            <span className="font-black text-sm sm:text-base xl:text-lg tracking-tight text-white block leading-none">
              Gelato<span className="text-amber-400">Balancer</span>
            </span>
            <span className="text-[11px] xl:text-xs text-slate-400 font-mono tracking-wider hidden 2xl:block">
              PWA Artesanal • 100% Offline
            </span>
          </div>
        </div>

        {/* Desktop Unified Navigation Bar with Integrated Backup Button */}
        <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1 bg-slate-800/90 p-1 xl:p-1.5 rounded-2xl border border-slate-700/80 shadow-inner shrink-0">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id as NavTab)}
                className={`h-9 xl:h-10 px-2 lg:px-2.5 xl:px-3.5 2xl:px-4 rounded-xl text-xs xl:text-sm font-bold flex items-center gap-1.5 xl:gap-2 whitespace-nowrap select-none transition-all shrink-0 ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                <span>
                  {tab.id === 'balanceamento' ? (
                    <>
                      <span className="hidden xl:inline">Balanceamento</span>
                      <span className="xl:hidden">Balancear</span>
                    </>
                  ) : tab.id === 'receitas' ? (
                    <>
                      <span className="hidden 2xl:inline">Livro de </span>Receitas
                    </>
                  ) : tab.id === 'ingredientes' ? (
                    <>
                      Insumos<span className="hidden 2xl:inline"> & Custos</span>
                    </>
                  ) : (
                    tab.label
                  )}
                </span>
              </button>
            );
          })}

          {/* Elegant Divider between Navigation tabs and Data Action */}
          <div className="w-px h-5 bg-slate-700/80 mx-0.5 xl:mx-1 shrink-0" />

          {/* Backup / Dados Button - Perfectly Harmonized with the same height and pill styling */}
          <button
            type="button"
            onClick={onOpenBackup}
            className="h-9 xl:h-10 px-2 lg:px-2.5 xl:px-3.5 2xl:px-4 rounded-xl text-xs xl:text-sm font-bold flex items-center gap-1.5 xl:gap-2 text-slate-300 hover:text-white hover:bg-slate-700/60 transition-all whitespace-nowrap select-none shrink-0 group"
            title="Importar ou Exportar Dados (.JSON)"
          >
            <Database className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform shrink-0" />
            <span>
              Backup<span className="hidden 2xl:inline"> / Dados</span>
            </span>
          </button>
        </nav>

        {/* Right Corner: 3-Phase Theme Toggle + Mobile Backup */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <ThemeToggle />

          <button
            type="button"
            onClick={onOpenBackup}
            className="h-8 sm:h-9 px-2 sm:px-3 bg-slate-800/90 hover:bg-slate-750 border border-slate-700/80 text-slate-200 text-xs font-bold rounded-xl transition-all flex lg:hidden items-center gap-1.5 shadow-sm active:scale-95 shrink-0"
            title="Importar ou Exportar Dados (.JSON)"
          >
            <Database className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="hidden sm:inline">Backup</span>
          </button>
        </div>
      </div>

      {/* Mobile/Tablet Horizontal Tabs Bar */}
      <div className="flex lg:hidden overflow-x-auto px-3 sm:px-4 py-2 bg-slate-900 border-t border-slate-800 gap-1.5">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id as NavTab)}
              className={`h-9 px-3 sm:px-3.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all shrink-0 select-none ${
                isActive
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                  : 'text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-750'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
              <span>{tab.shortLabel}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
