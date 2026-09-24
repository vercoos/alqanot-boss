import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { store as sec, signIn, setUnauthHandler } from './api';

interface BUser { id?: number; full_name?: string; phone?: string; role?: string; }
interface S {
  user: BUser | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  login: (phone: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuth = create<S>((set) => ({
  user: null,
  hydrated: false,
  async hydrate() {
    const safe = <T,>(p: Promise<T>): Promise<T | null> =>
      Promise.race([Promise.resolve(p).catch(() => null), new Promise<null>((r) => setTimeout(() => r(null), 6000))]);
    let token: string | null = null, prof: string | null = null;
    try { [token, prof] = await Promise.all([safe(sec.getToken()), safe(AsyncStorage.getItem('alqanot_boss_prof'))]); } catch {}
    let user: BUser | null = null; try { user = JSON.parse(prof || 'null'); } catch {}
    set({ user: token ? user : null, hydrated: true });
  },
  async login(phone, password) {
    const user = await signIn(phone, password);
    await AsyncStorage.setItem('alqanot_boss_prof', JSON.stringify(user || {}));
    set({ user: user || {} });
  },
  async logout() {
    await sec.setToken(null);
    await AsyncStorage.removeItem('alqanot_boss_prof');
    set({ user: null });
  },
}));

setUnauthHandler(() => { useAuth.getState().logout().catch(() => {}); });
