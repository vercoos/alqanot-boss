// Soft Chicken Client — premium tema (auto/yorug'/tungi)
import { Appearance } from 'react-native';
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Minimal, kam rangli palitra — moliyaviy dashboard uslubi (bitta brend urg'u, ko'pi neytral)
export const lightColors = {
  bg: '#F4F5F7',
  bgElevated: '#FFFFFF',
  bgCard: '#FFFFFF',
  bgInput: '#EEF0F3',
  border: 'rgba(17,20,26,0.09)',
  borderStrong: 'rgba(17,20,26,0.15)',
  text: '#111418',
  textMuted: 'rgba(17,20,26,0.56)',
  textDim: 'rgba(17,20,26,0.38)',
  primary: '#E06A28',
  primaryDark: '#C4571B',
  accent: '#E06A28',
  success: '#178A54',
  warning: '#B7791A',
  danger: '#CE3B2C',
  info: '#2E6FE0',
  onPrimary: '#FFFFFF',
  gradPrimary: ['#EE8A3F', '#E06A28'],
};

export const darkColors = {
  bg: '#0B0E12',
  bgElevated: '#12161C',
  bgCard: '#161B22',
  bgInput: '#1C222B',
  border: 'rgba(255,255,255,0.07)',
  borderStrong: 'rgba(255,255,255,0.13)',
  text: '#EDEFF3',
  textMuted: 'rgba(237,239,243,0.55)',
  textDim: 'rgba(237,239,243,0.34)',
  primary: '#F0813F',
  primaryDark: '#D96B2A',
  accent: '#F0813F',
  success: '#33C08A',
  warning: '#E0A33C',
  danger: '#E8604C',
  info: '#5B8DEF',
  onPrimary: '#FFFFFF',
  gradPrimary: ['#F0813F', '#E0662A'],
};

export const colors: any = { ...lightColors };

const baseFont = { xs: 11, sm: 13, md: 15, lg: 17, xl: 20, xxl: 26, hero: 34 };
export const fontSize: any = { ...baseFont };

export const radii = { xs: 8, sm: 12, md: 16, lg: 20, xl: 26, pill: 999 };
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 22, xxl: 30 };

export const shadow = {
  card: {
    shadowColor: '#1B2A4A', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08, shadowRadius: 16, elevation: 3,
  },
  soft: {
    shadowColor: '#1B2A4A', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
};

export type ThemeMode = 'auto' | 'light' | 'dark';
type Resolved = 'light' | 'dark';

function resolve(mode: ThemeMode): Resolved {
  if (mode === 'auto') return Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
  return mode;
}
function apply(mode: ThemeMode): Resolved {
  const r = resolve(mode);
  Object.assign(colors, r === 'dark' ? darkColors : lightColors);
  return r;
}

interface ThemeState {
  mode: ThemeMode;
  resolved: Resolved;
  ready: boolean;
  hydrate: () => Promise<void>;
  setMode: (m: ThemeMode) => void;
  toggle: () => void;
}
let sub: any = null;
export const useTheme = create<ThemeState>((set, get) => ({
  mode: 'auto',
  resolved: resolve('auto'),
  ready: false,
  async hydrate() {
    let mode: ThemeMode = 'auto';
    try {
      const m = await AsyncStorage.getItem('sc_theme');
      if (m === 'light' || m === 'dark' || m === 'auto') mode = m;
    } catch {}
    const resolved = apply(mode);
    set({ mode, resolved, ready: true });
    if (!sub) sub = Appearance.addChangeListener(() => {
      if (get().mode === 'auto') set({ resolved: apply('auto') });
    });
  },
  setMode(m) { const resolved = apply(m); AsyncStorage.setItem('sc_theme', m).catch(() => {}); set({ mode: m, resolved }); },
  toggle() { const o: ThemeMode[] = ['auto', 'light', 'dark']; get().setMode(o[(o.indexOf(get().mode) + 1) % 3]); },
}));
