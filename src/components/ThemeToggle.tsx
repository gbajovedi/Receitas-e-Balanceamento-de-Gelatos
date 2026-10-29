import React, { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import {
  ThemeMode,
  getStoredThemeMode,
  saveStoredThemeMode,
  getSystemTheme,
  getClientOS,
  THEME_CHANGE_EVENT
} from '../core/theme';

export const ThemeToggle: React.FC = () => {
  const [themeMode, setThemeMode] = useState<ThemeMode>(getStoredThemeMode);
  const [systemTheme, setSystemTheme] = useState<'dark' | 'light'>(getSystemTheme);
  const [clientOS, setClientOS] = useState<string>('Sistema');

  useEffect(() => {
    setClientOS(getClientOS());
    setSystemTheme(getSystemTheme());

    const handleThemeChange = () => {
      setThemeMode(getStoredThemeMode());
      setSystemTheme(getSystemTheme());
    };

    window.addEventListener(THEME_CHANGE_EVENT, handleThemeChange);
    window.addEventListener('storage', handleThemeChange);

    let mql: MediaQueryList | null = null;
    let listener: (() => void) | null = null;

    if (typeof window !== 'undefined' && window.matchMedia) {
      mql = window.matchMedia('(prefers-color-scheme: dark)');
      listener = () => {
        setSystemTheme(getSystemTheme());
      };
      if (mql.addEventListener) {
        mql.addEventListener('change', listener);
      } else if ((mql as any).addListener) {
        (mql as any).addListener(listener);
      }
    }

    return () => {
      window.removeEventListener(THEME_CHANGE_EVENT, handleThemeChange);
      window.removeEventListener('storage', handleThemeChange);
      if (mql && listener) {
        if (mql.removeEventListener) {
          mql.removeEventListener('change', listener);
        } else if ((mql as any).removeListener) {
          (mql as any).removeListener(listener);
        }
      }
    };
  }, []);

  const handleSelectMode = (mode: ThemeMode) => {
    setThemeMode(mode);
    saveStoredThemeMode(mode);
  };

  const autoTooltip = `Automático: segue o tema do seu sistema (${clientOS}). Atualmente em modo ${
    systemTheme === 'dark' ? 'Escuro' : 'Claro'
  }.`;

  return (
    <div
      className="theme-switch-track flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-700/80 shadow-inner select-none transition-colors"
      role="group"
      aria-label="Controle de Tema: Modo Escuro, Automático e Modo Claro"
    >
      {/* 1. Esquerda: Modo Escuro (Ícone de Lua ampliado) */}
      <button
        type="button"
        onClick={() => handleSelectMode('dark')}
        className={`h-8 w-8 sm:w-9 rounded-lg transition-all flex items-center justify-center ${
          themeMode === 'dark'
            ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 scale-[1.03]'
            : 'theme-switch-inactive text-slate-400 hover:text-white hover:bg-slate-700/50'
        }`}
        title="Modo Escuro (Fixo)"
        aria-label="Ativar Modo Escuro"
        aria-pressed={themeMode === 'dark'}
      >
        <Moon className="w-5 h-5 shrink-0" />
      </button>

      {/* 2. Centro: Automático (Apenas texto Auto) */}
      <button
        type="button"
        onClick={() => handleSelectMode('auto')}
        className={`h-8 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center ${
          themeMode === 'auto'
            ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20 scale-[1.03]'
            : 'theme-switch-inactive text-slate-400 hover:text-white hover:bg-slate-700/50'
        }`}
        title={autoTooltip}
        aria-label={autoTooltip}
        aria-pressed={themeMode === 'auto'}
      >
        <span className="text-xs font-bold tracking-tight">Auto</span>
      </button>

      {/* 3. Direita: Modo Claro (Ícone de Sol ampliado) */}
      <button
        type="button"
        onClick={() => handleSelectMode('light')}
        className={`h-8 w-8 sm:w-9 rounded-lg transition-all flex items-center justify-center ${
          themeMode === 'light'
            ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 scale-[1.03]'
            : 'theme-switch-inactive text-slate-400 hover:text-white hover:bg-slate-700/50'
        }`}
        title="Modo Claro (Fixo)"
        aria-label="Ativar Modo Claro"
        aria-pressed={themeMode === 'light'}
      >
        <Sun className="w-5 h-5 shrink-0" />
      </button>
    </div>
  );
};
