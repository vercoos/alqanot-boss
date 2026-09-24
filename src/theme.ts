// AL QANOT Kuryer — tema (auto/yorug'/tungi). BOS palitrasi asosida.
import { Appearance } from 'react-native';
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Premium, past-to'yingan palitra — bitta muloyim oltin urg'u, ko'pi neytral
export const lightColors = {
  bg: '#F5F5F3', bgElevated: '#FFFFFF', bgCard: '#FFFFFF', bgInput: '#ECECE8',
  border: 'rgba(20,20,22,0.08)', borderStrong: 'rgba(20,20,22,0.14)',
  text: '#1A1A1D', textMuted: 'rgba(26,26,29,0.55)', textDim: 'rgba(26,26,29,0.34)',
  primary: '#A9793C', primaryDark: '#8F6531', accent: '#A9793C',
  success: '#3F8E6B', warning: '#9A7B37', danger: '#B85B4E', info: '#4A6FA5', onPrimary: '#FFFFFF',
};
export const darkColors = {
  bg: '#0C0D10', bgElevated: '#131418', bgCard: '#16171C', bgInput: '#1D1F25',
  border: 'rgba(255,255,255,0.06)', borderStrong: 'rgba(255,255,255,0.12)',
  text: '#F0F1F3', textMuted: 'rgba(240,241,243,0.52)', textDim: 'rgba(240,241,243,0.30)',
  primary: '#C6A063', primaryDark: '#AD8A50', accent: '#C6A063',
  success: '#5FA98A', warning: '#C2A366', danger: '#CE8175', info: '#7E9BC4', onPrimary: '#14110A',
};
export const colors: any = { ...darkColors };

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
    let mode: ThemeMode = 'auto';
    try { const m = await AsyncStorage.getItem('alqanot_boss_theme'); if (m === 'light' || m === 'dark' || m === 'auto') mode = m; } catch {}
    const resolved = apply(mode);
    set({ mode, resolved, ready: true });
    if (!sub) sub = Appearance.addChangeListener(() => { if (get().mode === 'auto') set({ resolved: apply('auto') }); });
  },
  setMode(m) { const resolved = apply(m); AsyncStorage.setItem('alqanot_boss_theme', m).catch(() => {}); set({ mode: m, resolved }); },
}));
