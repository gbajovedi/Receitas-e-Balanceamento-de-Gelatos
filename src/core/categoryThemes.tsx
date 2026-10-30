import React from 'react';
import {
  Milk,
  Leaf,
  Zap,
  Wine,
  Cherry,
  Citrus,
  Apple,
  IceCream,
  Nut,
  Palmtree
} from 'lucide-react';

// Custom SVG icon for chocolate bars: 6 distinct embossed tablets, bold, clean lines
export const ChocolateIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* Outer chocolate bar outline with soft chocolate tint */}
    <rect x="4" y="2.5" width="16" height="19" rx="2.5" fill="currentColor" fillOpacity="0.2" />
    {/* Center vertical groove */}
    <line x1="12" y1="2.5" x2="12" y2="21.5" />
    {/* Horizontal tablet divider grooves */}
    <line x1="4.5" y1="8.8" x2="19.5" y2="8.8" />
    <line x1="4.5" y1="15.2" x2="19.5" y2="15.2" />
  </svg>
);

export interface CategoryTheme {
  gradient: string;
  badge: string;
  icon: React.ReactNode;
}

export const getCategoryTheme = (category: string = ''): CategoryTheme => {
  const cat = (category || '').toLowerCase();

  // 1. Gelatos de Oleaginosas -> Nut (Castanhas / Pistache / Avelã / Nozes)
  if (cat.includes('oleaginosa') || cat.includes('noz') || cat.includes('pistache') || cat.includes('avelã') || cat.includes('avela')) {
    return {
      gradient: 'from-amber-600 via-amber-500 to-lime-600',
      badge: 'bg-amber-600/15 text-amber-300 border-amber-500/40',
      icon: <Nut className="w-3.5 h-3.5 text-amber-300 shrink-0" />
    };
  }

  // 2. Gelatos de Leite com Fruta -> Cherry (Cerejas)
  if (cat.includes('leite com fruta')) {
    return {
      gradient: 'from-pink-500 via-rose-400 to-sky-400',
      badge: 'bg-pink-500/15 text-pink-300 border-pink-500/40',
      icon: <Cherry className="w-3.5 h-3.5 text-pink-400 shrink-0" />
    };
  }

  // 2. Gelatos de Leite -> Milk (Garrafa de leite)
  if (cat.includes('leite')) {
    return {
      gradient: 'from-sky-400 via-cyan-400 to-blue-500',
      badge: 'bg-sky-500/15 text-sky-300 border-sky-500/40',
      icon: <Milk className="w-3.5 h-3.5 text-sky-400 shrink-0" />
    };
  }

  // 3. Sorbets Cítricos / Frutas Ácidas -> Citrus (Fatia de cítrico fresca)
  if (cat.includes('cítric') || cat.includes('citric') || cat.includes('ácid') || cat.includes('acida')) {
    return {
      gradient: 'from-amber-400 via-lime-400 to-emerald-400',
      badge: 'bg-lime-500/15 text-lime-300 border-lime-500/40',
      icon: <Citrus className="w-3.5 h-3.5 text-lime-400 shrink-0" />
    };
  }

  // 4. Sorbets Polposos / Frutas Densas -> Palmtree (Palmeira tropical)
  if (cat.includes('polpos') || cat.includes('densa') || cat.includes('tropical')) {
    return {
      gradient: 'from-amber-500 via-orange-500 to-rose-400',
      badge: 'bg-orange-500/15 text-orange-300 border-orange-500/40',
      icon: <Palmtree className="w-3.5 h-3.5 text-orange-400 shrink-0" />
    };
  }

  // 5. Sorbets Geral -> Citrus
  if (cat.includes('sorbet') || cat.includes('fruta')) {
    return {
      gradient: 'from-rose-500 via-orange-400 to-amber-400',
      badge: 'bg-rose-500/15 text-rose-300 border-rose-500/40',
      icon: <Citrus className="w-3.5 h-3.5 text-rose-400 shrink-0" />
    };
  }

  // 4. Chocolate base água -> ChocolateIcon (Barra de chocolate artesanal nítida)
  if (cat.includes('chocolate') || cat.includes('cacau')) {
    return {
      gradient: 'from-amber-700 via-yellow-700 to-amber-900',
      badge: 'bg-amber-950/70 text-amber-200 border-amber-600/50',
      icon: <ChocolateIcon className="w-4 h-4 text-amber-300 shrink-0" />
    };
  }

  // 5. Vegano -> Leaf (Folha natural)
  if (cat.includes('vegano')) {
    return {
      gradient: 'from-emerald-400 via-teal-400 to-green-500',
      badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
      icon: <Leaf className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
    };
  }

  // 6. Gelatos Proteicos -> Zap (Raio de energia/whey)
  if (cat.includes('proteico')) {
    return {
      gradient: 'from-purple-500 via-fuchsia-500 to-indigo-500',
      badge: 'bg-purple-500/15 text-purple-300 border-purple-500/40',
      icon: <Zap className="w-3.5 h-3.5 text-purple-400 shrink-0" />
    };
  }

  // 7. Alcoólicos -> Wine (Taça de vinho/licor)
  if (cat.includes('alco')) {
    return {
      gradient: 'from-yellow-400 via-amber-400 to-amber-600',
      badge: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
      icon: <Wine className="w-3.5 h-3.5 text-amber-400 shrink-0" />
    };
  }

  // 8. Zero Açúcar / Baixas Calorias -> Apple (Símbolo universal de nutrição e baixas calorias)
  if (cat.includes('zero')) {
    return {
      gradient: 'from-teal-400 via-cyan-400 to-blue-400',
      badge: 'bg-teal-500/15 text-teal-300 border-teal-500/40',
      icon: <Apple className="w-3.5 h-3.5 text-teal-400 shrink-0" />
    };
  }

  // Padrão / Outros -> IceCream (Casquinha de Gelato artesanal)
  return {
    gradient: 'from-amber-400 to-amber-600',
    badge: 'bg-slate-800 text-slate-300 border-slate-700',
    icon: <IceCream className="w-3.5 h-3.5 text-amber-400 shrink-0" />
  };
};

export const CategoryBadge: React.FC<{
  category: string;
  className?: string;
  showIcon?: boolean;
}> = ({ category, className = '', showIcon = true }) => {
  const theme = getCategoryTheme(category);
  return (
    <span
      className={`text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full border font-bold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-all ${theme.badge} ${className}`}
    >
      {showIcon && theme.icon}
      <span>{category}</span>
    </span>
  );
};

