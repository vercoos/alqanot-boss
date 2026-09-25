import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { store as sec, signIn, setUnauthHandler } from './api';

const K_PIN = 'scbos-pin';

interface BossUser { email?: string; name?: string; id?: number; }
interface S {
  user: BossUser | null; hydrated: boolean; locked: boolean; hasPin: boolean; biometric: boolean;
  hydrate: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  unlockPin: (pin: string) => Promise<void>;
  unlockBio: () => void;
  setPin: (pin: string) => Promise<void>;
  setBiometric: (on: boolean) => void;
  logout: () => Promise<void>;
}
export const useAuth = create<S>((set, get) => ({
  user: null, hydrated: false, locked: false, hasPin: false, biometric: false,
  async hydrate() {
    // Har bir storage o'qishi mustaqil himoyalanadi: xato bersa yoki osilib qolsa (native
    // SecureStore/AsyncStorage muammosi) — null qaytadi, ilova spinnerda qotib qolmaydi.
    const safe = <T,>(p: Promise<T>): Promise<T | null> =>
      Promise.race([
        Promise.resolve(p).catch(() => null),
        new Promise<null>((res) => setTimeout(() => res(null), 6000)),
      ]);
    let token: string | null = null, pin: string | null = null, prof: string | null = null, quick: string | null = null;
    try {
      [token, pin, prof, quick] = await Promise.all([
        safe(sec.getToken()), safe(SecureStore.getItemAsync(K_PIN)),
        safe(AsyncStorage.getItem('scbos_prof')), safe(AsyncStorage.getItem('scbos_quick')),
      ]);
    } catch {}
    let biometric = false; try { biometric = !!JSON.parse(quick || '{}').biometric; } catch {}
    let user: BossUser | null = null; try { user = JSON.parse(prof || 'null'); } catch {}
    const hasPin = !!pin;
    set({ user: token ? user : null, hasPin, biometric, locked: !!token && (hasPin || biometric), hydrated: true });
    // token bor, lekin qulf yo'q → to'g'ridan kirsin
    if (token && !hasPin && !biometric) set({ locked: false });
  },
  async login(email, password) {
    const { user } = await signIn(email, password);
    const prof = { email: user?.email || email, name: user?.firstName || user?.name || user?.fullName, id: user?.id };
    await AsyncStorage.setItem('scbos_prof', JSON.stringify(prof));
    set({ user: prof, locked: false });
  },
  async unlockPin(pin) {
    const saved = await SecureStore.getItemAsync(K_PIN);
    if (saved !== pin) throw new Error('PIN noto\'g\'ri');
    set({ locked: false });
  },
  unlockBio() { set({ locked: false }); },
  async setPin(pin) { await SecureStore.setItemAsync(K_PIN, pin); set({ hasPin: true }); },
  setBiometric(on) { AsyncStorage.setItem('scbos_quick', JSON.stringify({ biometric: on })).catch(() => {}); set({ biometric: on }); },
  async logout() { await sec.setToken(null); await SecureStore.deleteItemAsync(K_PIN); await AsyncStorage.multiRemove(['scbos_prof', 'scbos_quick']); set({ user: null, hasPin: false, biometric: false, locked: false }); },
}));

// Token muddati tugasa (24 soat) — API 401 qaytaradi → to'liq chiqib, qayta login so'raladi
setUnauthHandler(() => { useAuth.getState().logout().catch(() => {}); });
