import React, { useState, useEffect } from 'react';
import { Moon, Sun, SunMoon } from 'lucide-react';
import {
  ThemeMode,
  getStoredThemeMode,
  saveStoredThemeMode,
  calculateSolarTimes,
  THEME_CHANGE_EVENT
} from '../core/theme';

export const ThemeToggle: React.FC = () => {
  const [themeMode, setThemeMode] = useState<ThemeMode>(getStoredThemeMode);
  const [solar, setSolar] = useState(calculateSolarTimes);

  useEffect(() => {
    // Atualiza o cálculo solar a cada minuto para transição automática do pôr do sol
    const interval = setInterval(() => {
      setSolar(calculateSolarTimes());
    }, 60000);

    const handleThemeChange = () => {
      setThemeMode(getStoredThemeMode());
      setSolar(calculateSolarTimes());
    };

    window.addEventListener(THEME_CHANGE_EVENT, handleThemeChange);
    window.addEventListener('storage', handleThemeChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener(THEME_CHANGE_EVENT, handleThemeChange);
      window.removeEventListener('storage', handleThemeChange);
    };
  }, []);

  const handleSelectMode = (mode: ThemeMode) => {
    setThemeMode(mode);
    saveStoredThemeMode(mode);
  };

  const autoTooltip = `Automático pelo Pôr do Sol (Hoje: Nascer às ${solar.sunriseStr} • Pôr do sol às ${solar.sunsetStr} • Agora: ${
    solar.isNight ? 'Modo Escuro' : 'Modo Claro'
  })`;

  return (
    <div
      className="flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700/80 shadow-inner select-none transition-colors"
      role="group"
      aria-label="Controle de Tema Claro, Automático e Escuro"
    >
      {/* 1. Esquerda: Modo Escuro (Lua) */}
      <button
        type="button"
        onClick={() => handleSelectMode('dark')}
        className={`h-8 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
          themeMode === 'dark'
            ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20 scale-[1.02]'
            : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
        }`}
        title="Modo Escuro (Fixo)"
        aria-pressed={themeMode === 'dark'}
      >
        <Moon className="w-3.5 h-3.5" />
        <span className="hidden xl:inline text-[11px]">Escuro</span>
      </button>

      {/* 2. Centro: Automático (Pôr do Sol) */}
      <button
        type="button"
        onClick={() => handleSelectMode('auto')}
        className={`h-8 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
          themeMode === 'auto'
            ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20 scale-[1.02]'
            : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
        }`}
        title={autoTooltip}
        aria-pressed={themeMode === 'auto'}
      >
        <SunMoon className="w-3.5 h-3.5" />
        <span className="text-[11px] font-bold">Auto</span>
      </button>

      {/* 3. Direita: Modo Claro (Sol) */}
      <button
        type="button"
        onClick={() => handleSelectMode('light')}
        className={`h-8 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
          themeMode === 'light'
            ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20 scale-[1.02]'
            : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
        }`}
        title="Modo Claro (Fixo)"
        aria-pressed={themeMode === 'light'}
      >
        <Sun className="w-3.5 h-3.5" />
        <span className="hidden xl:inline text-[11px]">Claro</span>
      </button>
    </div>
  );
};
