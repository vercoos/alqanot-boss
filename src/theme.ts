// AL QANOT Kuryer — tema (auto/yorug'/tungi). BOS palitrasi asosida.
import { Appearance } from 'react-native';
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Professional, yorug' — zumrad brend (desktop bilan bir xil)
export const lightColors = {
  bg: '#F4F6F8', bgElevated: '#FFFFFF', bgCard: '#FFFFFF', bgInput: '#F1F3F6',
  border: 'rgba(14,23,38,0.09)', borderStrong: 'rgba(14,23,38,0.16)',
  text: '#0E1726', textMuted: 'rgba(14,23,38,0.56)', textDim: 'rgba(14,23,38,0.36)',
  primary: '#0B7A56', primaryDark: '#095E43', accent: '#0E9F6E',
  success: '#0E9F6E', warning: '#C27803', danger: '#E5484D', info: '#3E7BFA', onPrimary: '#FFFFFF',
};
export const darkColors = {
  bg: '#0B1512', bgElevated: '#12201B', bgCard: '#14241E', bgInput: '#1B2E27',
  border: 'rgba(255,255,255,0.07)', borderStrong: 'rgba(255,255,255,0.14)',
  text: '#EAF2EE', textMuted: 'rgba(234,242,238,0.56)', textDim: 'rgba(234,242,238,0.34)',
  primary: '#15B37E', primaryDark: '#0E9F6E', accent: '#15B37E',
  success: '#15B37E', warning: '#D9A441', danger: '#E86A6A', info: '#5B9BF0', onPrimary: '#04120D',
};
export const colors: any = { ...lightColors };

export const fontSize: any = { xs: 11, sm: 13, md: 15, lg: 17, xl: 20, xxl: 26, hero: 34 };
export const radii = { xs: 8, sm: 12, md: 16, lg: 20, xl: 26, pill: 999 };
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 22, xxl: 30 };

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
interface ThemeState { mode: ThemeMode; resolved: Resolved; ready: boolean; hydrate: () => Promise<void>; setMode: (m: ThemeMode) => void; }
let sub: any = null;
export const useTheme = create<ThemeState>((set, get) => ({
  mode: 'auto', resolved: resolve('auto'), ready: false,
  async hydrate() {
    let mode: ThemeMode = 'light';
    try { const m = await AsyncStorage.getItem('alqanot_boss_theme'); if (m === 'light' || m === 'dark' || m === 'auto') mode = m; } catch {}
    const resolved = apply(mode);
    set({ mode, resolved, ready: true });
    if (!sub) sub = Appearance.addChangeListener(() => { if (get().mode === 'auto') set({ resolved: apply('auto') }); });
  },
  setMode(m) { const resolved = apply(m); AsyncStorage.setItem('alqanot_boss_theme', m).catch(() => {}); set({ mode: m, resolved }); },
}));
