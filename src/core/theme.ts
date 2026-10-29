export type ThemeMode = 'dark' | 'auto' | 'light';

export const THEME_STORAGE_KEY = 'gelato_theme_mode_v1';
export const THEME_CHANGE_EVENT = 'gelato-theme-changed';

interface SolarTimes {
  sunriseStr: string;
  sunsetStr: string;
  isNight: boolean;
}

// Coordenadas das principais capitais e fusos para estimativa astronômica instantânea sem popups de permissão
const TIMEZONE_COORDS: Record<string, { lat: number; lon: number }> = {
  'America/Sao_Paulo': { lat: -23.55, lon: -46.63 },
  'America/Rio_Branco': { lat: -9.97, lon: -67.81 },
  'America/Manaus': { lat: -3.11, lon: -60.02 },
  'America/Belem': { lat: -1.45, lon: -48.50 },
  'America/Fortaleza': { lat: -3.73, lon: -38.52 },
  'America/Recife': { lat: -8.05, lon: -34.88 },
  'America/Bahia': { lat: -12.97, lon: -38.51 },
  'America/Cuiaba': { lat: -15.60, lon: -56.09 },
  'America/Campo_Grande': { lat: -20.44, lon: -54.64 },
  'America/Porto_Velho': { lat: -8.76, lon: -63.90 },
  'America/Boa_Vista': { lat: 2.82, lon: -60.67 },
  'America/Maceio': { lat: -9.66, lon: -35.73 },
  'America/Araguaina': { lat: -7.19, lon: -48.20 },
  'America/Santarem': { lat: -2.44, lon: -54.71 },
  'America/Noronha': { lat: -3.85, lon: -32.42 }
};

/**
 * Calcula o horário preciso de nascer e pôr do sol local para o dia de hoje.
 */
export function calculateSolarTimes(now: Date = new Date()): SolarTimes {
  let lat = -23.55;
  let lon = -46.63;

  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (TIMEZONE_COORDS[tz]) {
      lat = TIMEZONE_COORDS[tz].lat;
      lon = TIMEZONE_COORDS[tz].lon;
    } else {
      const tzOffsetHours = -now.getTimezoneOffset() / 60;
      lon = tzOffsetHours * 15;
      lat = tzOffsetHours <= -3 ? -15 : 40;
    }
  } catch {
    // fallback para padrão Brasil (São Paulo)
  }

  // Dia do ano (1 a 366)
  const startOfYear = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - startOfYear.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);

  // Declinação solar (em radianos)
  const degToRad = (d: number) => (d * Math.PI) / 180;
  const radToDeg = (r: number) => (r * 180) / Math.PI;

  const declination = degToRad(23.45 * Math.sin(degToRad((360 / 365) * (dayOfYear - 81))));
  const latRad = degToRad(lat);

  // Ângulo horário para o nascer/pôr do sol com refração atmosférica (-0.833 graus)
  const cosHourAngle =
    (Math.sin(degToRad(-0.833)) - Math.sin(latRad) * Math.sin(declination)) /
    (Math.cos(latRad) * Math.cos(declination));

  const clampedCos = Math.max(-1.0, Math.min(1.0, cosHourAngle));
  const hourAngleDeg = radToDeg(Math.acos(clampedCos));

  // Equação do tempo (minutos)
  const b = degToRad((360 / 365) * (dayOfYear - 81));
  const eot = 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b);

  // Fuso horário local em horas
  const tzOffsetHours = -now.getTimezoneOffset() / 60;
  const timeOffset = 4 * (lon - tzOffsetHours * 15) + eot;
  const solarNoonMin = 720 - timeOffset;

  const sunriseMin = solarNoonMin - hourAngleDeg * 4;
  const sunsetMin = solarNoonMin + hourAngleDeg * 4;

  const formatMin = (m: number) => {
    let normalized = Math.round(m);
    while (normalized < 0) normalized += 1440;
    normalized = normalized % 1440;
    const hh = String(Math.floor(normalized / 60)).padStart(2, '0');
    const mm = String(normalized % 60).padStart(2, '0');
    return `${hh}:${mm}`;
  };

  const currentMin = now.getHours() * 60 + now.getMinutes();
  const isNight = currentMin < sunriseMin || currentMin >= sunsetMin;

  return {
    sunriseStr: formatMin(sunriseMin),
    sunsetStr: formatMin(sunsetMin),
    isNight
  };
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
  return 'auto'; // Padrão automático inteligente
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
 * Aplica o tema visual efetivo no DOM (`<html className="dark">` ou `<html className="light">`)
 */
export function applyTheme(mode: ThemeMode = getStoredThemeMode()): 'dark' | 'light' {
  if (typeof document === 'undefined') return 'dark';

  let effective: 'dark' | 'light' = 'dark';

  if (mode === 'dark') {
    effective = 'dark';
  } else if (mode === 'light') {
    effective = 'light';
  } else {
    // Modo automático: verifica o pôr do sol
    const solar = calculateSolarTimes();
    effective = solar.isNight ? 'dark' : 'light';
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

