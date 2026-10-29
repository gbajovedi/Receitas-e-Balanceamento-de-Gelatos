export type ThemeMode = 'dark' | 'auto' | 'light';

export const THEME_STORAGE_KEY = 'gelato_theme_mode_v1';
export const THEME_CHANGE_EVENT = 'gelato-theme-changed';

/**
 * Detecta o tema padrão ativo no sistema operacional (Android, iOS, Windows, macOS ou Linux).
 * Utiliza a API nativa prefers-color-scheme.
 */
export function getSystemTheme(): 'dark' | 'light' {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'dark'; // Fallback padrão seguro
}

/**
 * Identifica o sistema operacional do usuário para fins de exibição na interface (Android, iOS, Windows, macOS, Linux).
 */
export function getClientOS(): string {
  if (typeof navigator === 'undefined') return 'Sistema';
  const ua = navigator.userAgent || '';
  if (/android/i.test(ua)) return 'Android';
  if (/iphone|ipad|ipod/i.test(ua)) return 'iOS';
  if (/windows/i.test(ua)) return 'Windows';
  if (/macintosh|mac os x/i.test(ua)) return 'macOS';
  if (/linux/i.test(ua)) return 'Linux';
  return 'Sistema';
}

export function getStoredThemeMode(): ThemeMode {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode;
    if (raw === 'dark' || raw === 'light' || raw === 'auto') {
      return raw;
    }
  } catch (err) {
    console.warn('Erro ao ler tema do localStorage:', err);
  }
  return 'auto'; // Padrão recomendado: segue o sistema do usuário
}

export function saveStoredThemeMode(mode: ThemeMode): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, mode);
    applyTheme(mode);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
    }
  } catch (err) {
    console.warn('Erro ao salvar tema no localStorage:', err);
  }
}

/**
 * Aplica o tema visual efetivo no DOM (`<html class="dark">` ou `<html class="light">`)
 */
export function applyTheme(mode: ThemeMode = getStoredThemeMode()): 'dark' | 'light' {
  if (typeof document === 'undefined') return 'dark';

  let effective: 'dark' | 'light' = 'dark';

  if (mode === 'dark') {
    effective = 'dark';
  } else if (mode === 'light') {
    effective = 'light';
  } else {
    // Modo automático: segue o padrão do sistema operacional (Android, iOS, Windows, macOS, Linux)
    effective = getSystemTheme();
  }

  const root = document.documentElement;
  if (effective === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
    root.style.colorScheme = 'dark';
  } else {
    root.classList.add('light');
    root.classList.remove('dark');
    root.style.colorScheme = 'light';
  }

  // Atualiza meta theme-color para a barra de status do celular
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.setAttribute('content', effective === 'dark' ? '#0f172a' : '#f8fafc');
  }

  return effective;
}

/**
 * Registra o ouvinte nativo do sistema operacional para alternância automática de tema
 * quando o usuário altera o tema nas configurações do Android, iOS, Windows ou macOS.
 */
let isListenerInitialized = false;

export function initThemeListener(): void {
  if (typeof window === 'undefined' || !window.matchMedia || isListenerInitialized) return;
  isListenerInitialized = true;

  try {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleSystemChange = () => {
      const currentMode = getStoredThemeMode();
      if (currentMode === 'auto') {
        applyTheme('auto');
        window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemChange);
    } else if ((mediaQuery as any).addListener) {
      (mediaQuery as any).addListener(handleSystemChange);
    }
  } catch (err) {
    console.warn('Erro ao inicializar ouvinte de tema do sistema:', err);
  }
}

// Inicializa o ouvinte automaticamente ao importar
if (typeof window !== 'undefined') {
  initThemeListener();
}
