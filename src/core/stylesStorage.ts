import { StyleStandard } from '../types/gelato';
import initialStyles from '../data/styles.json';

export const STYLES_STORAGE_KEY = 'gelato_custom_styles_v1';
export const STYLES_PRESET_KEY = 'gelato_active_styles_preset_v1';
export const STYLES_UPDATED_EVENT = 'gelato-styles-updated';

export type StylePresetId = 'gold' | 'carpigiani' | 'custom';

/**
 * Padrão Ouro Híbrido Protegido (Opção 2 - Recomendado)
 * - PAC Carpigiani (220-260 para nozes, 280-330 para sorbets)
 * - Blindagem de Caviezel contra arenosidade (SLNG máx 10.5%)
 * - Açúcares moderados para valorizar frutas tropicais maduras brasileiras
 */
export const GOLD_STANDARD_STYLES: Record<string, StyleStandard> = initialStyles as Record<string, StyleStandard>;

/**
 * Carpigiani Gelato University (CGU 2025/2026 - Padrão Estrito Acadêmico)
 * - Açúcares frutas: 22% a 24% (Slide 11/48)
 * - Gordura leite: 7% a 16% (Slide 11)
 * - SLNG: 7% a 12% (Slide 11)
 * - Sorbets unificados: 26% a 31% de açúcares (Slide 60)
 */
export const CARPIGIANI_STRICT_STYLES: Record<string, StyleStandard> = {
  ...GOLD_STANDARD_STYLES,
  'Gelatos de Leite': {
    name: 'Gelatos de Leite',
    pacDivisor: 24,
    min: {
      sugars: 0.18,
      fat: 0.07,
      msnf: 0.07,
      otherSolids: 0.002,
      totalSolids: 0.37,
      water: 0.54,
      pod: 120,
      pac: 220,
      protein: 0
    },
    max: {
      sugars: 0.22,
      fat: 0.16,
      msnf: 0.12,
      otherSolids: 0.10,
      totalSolids: 0.46,
      water: 0.63,
      pod: 220,
      pac: 280,
      protein: 0
    }
  },
  'Gelatos de Oleaginosas': {
    name: 'Gelatos de Oleaginosas',
    pacDivisor: 24,
    min: {
      sugars: 0.18,
      fat: 0.07,
      msnf: 0.07,
      otherSolids: 0.002,
      totalSolids: 0.37,
      water: 0.54,
      pod: 120,
      pac: 220,
      protein: 0
    },
    max: {
      sugars: 0.20,
      fat: 0.16,
      msnf: 0.12,
      otherSolids: 0.10,
      totalSolids: 0.46,
      water: 0.63,
      pod: 220,
      pac: 260,
      protein: 0
    }
  },
  'Sorbets': {
    name: 'Sorbets (Geral)',
    pacDivisor: 24,
    min: {
      sugars: 0.26,
      fat: 0,
      msnf: 0,
      otherSolids: 0.004,
      totalSolids: 0.28,
      water: 0.68,
      pod: 200,
      pac: 280,
      protein: 0
    },
    max: {
      sugars: 0.31,
      fat: 0.005,
      msnf: 0,
      otherSolids: 0.02,
      totalSolids: 0.32,
      water: 0.72,
      pod: 280,
      pac: 330,
      protein: 0
    }
  },
  'Sorbets Cítricos / Frutas Ácidas': {
    name: 'Sorbets Cítricos / Frutas Ácidas',
    pacDivisor: 24,
    min: {
      sugars: 0.26,
      fat: 0,
      msnf: 0,
      otherSolids: 0.004,
      totalSolids: 0.28,
      water: 0.68,
      pod: 200,
      pac: 280,
      protein: 0
    },
    max: {
      sugars: 0.31,
      fat: 0.005,
      msnf: 0,
      otherSolids: 0.02,
      totalSolids: 0.32,
      water: 0.72,
      pod: 280,
      pac: 330,
      protein: 0
    }
  },
  'Sorbets Polposos / Frutas Densas': {
    name: 'Sorbets Polposos / Frutas Densas',
    pacDivisor: 24,
    min: {
      sugars: 0.26,
      fat: 0,
      msnf: 0,
      otherSolids: 0.004,
      totalSolids: 0.28,
      water: 0.65,
      pod: 200,
      pac: 280,
      protein: 0
    },
    max: {
      sugars: 0.31,
      fat: 0.01,
      msnf: 0,
      otherSolids: 0.04,
      totalSolids: 0.35,
      water: 0.72,
      pod: 280,
      pac: 330,
      protein: 0
    }
  },
  'Gelatos de Leite com Fruta': {
    name: 'Gelatos de Leite com Fruta',
    pacDivisor: 24,
    min: {
      sugars: 0.22,
      fat: 0.03,
      msnf: 0.03,
      otherSolids: 0.002,
      totalSolids: 0.32,
      water: 0.58,
      pod: 180,
      pac: 250,
      protein: 0
    },
    max: {
      sugars: 0.24,
      fat: 0.10,
      msnf: 0.07,
      otherSolids: 0.08,
      totalSolids: 0.42,
      water: 0.68,
      pod: 260,
      pac: 290,
      protein: 0
    }
  }
};

/**
 * Carrega estilos efetivos mesclando Padrão Ouro com eventuais ajustes do localStorage
 */
export function getStoredStyles(): Record<string, StyleStandard> {
  if (typeof window === 'undefined') return GOLD_STANDARD_STYLES;
  try {
    const raw = localStorage.getItem(STYLES_STORAGE_KEY);
    if (!raw) return GOLD_STANDARD_STYLES;
    const parsed = JSON.parse(raw);
    return { ...GOLD_STANDARD_STYLES, ...parsed };
  } catch (e) {
    console.warn('Erro ao carregar estilos customizados do localStorage:', e);
    return GOLD_STANDARD_STYLES;
  }
}

/**
 * Retorna o ID do preset ativo ('gold', 'carpigiani' ou 'custom')
 */
export function getActivePresetId(): StylePresetId {
  if (typeof window === 'undefined') return 'gold';
  try {
    const p = localStorage.getItem(STYLES_PRESET_KEY);
    if (p === 'gold' || p === 'carpigiani' || p === 'custom') return p;
    return 'gold';
  } catch {
    return 'gold';
  }
}

/**
 * Salva estilos e dispara evento global de atualização imediata
 */
export function saveStoredStyles(
  styles: Record<string, StyleStandard>,
  presetId: StylePresetId = 'custom'
): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STYLES_STORAGE_KEY, JSON.stringify(styles));
    localStorage.setItem(STYLES_PRESET_KEY, presetId);
    currentStylesMap = { ...styles };
    window.dispatchEvent(
      new CustomEvent(STYLES_UPDATED_EVENT, { detail: { styles, presetId } })
    );
  } catch (e) {
    console.error('Erro ao salvar estilos no localStorage:', e);
  }
}

/**
 * Restaura o Padrão Ouro Recomendado com 1 clique
 */
export function applyGoldStandardPreset(): Record<string, StyleStandard> {
  saveStoredStyles(GOLD_STANDARD_STYLES, 'gold');
  return GOLD_STANDARD_STYLES;
}

/**
 * Aplica o preset estrito Carpigiani Gelato University com 1 clique
 */
export function applyCarpigianiPreset(): Record<string, StyleStandard> {
  saveStoredStyles(CARPIGIANI_STRICT_STYLES, 'carpigiani');
  return CARPIGIANI_STRICT_STYLES;
}

/**
 * Restaura um único estilo específico para o seu valor Padrão Ouro
 */
export function resetSingleStyleToGold(styleName: string): Record<string, StyleStandard> {
  const current = getStoredStyles();
  const gold = GOLD_STANDARD_STYLES[styleName];
  if (!gold) return current;
  const updated = { ...current, [styleName]: JSON.parse(JSON.stringify(gold)) };
  saveStoredStyles(updated, 'custom');
  return updated;
}

/**
 * Atualiza um único estilo mantendo os outros
 */
export function saveSingleStyle(
  styleName: string,
  updatedStyle: StyleStandard
): Record<string, StyleStandard> {
  const current = getStoredStyles();
  const updated = { ...current, [styleName]: updatedStyle };
  saveStoredStyles(updated, 'custom');
  return updated;
}

/**
 * Mapa de estilos carregado em memória para acesso síncrono rápido
 */
export let currentStylesMap: Record<string, StyleStandard> = getStoredStyles();
