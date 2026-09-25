import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const extra: any = Constants.expoConfig?.extra || {};
// Server manzili app.json'дан (qat'iy). Eski saqlangan qiymat tozalanadi.
const base: string = extra.apiBase || 'http://72.60.17.70:6010';
const K_TOKEN = 'alqanot-boss-token';
const K_API = 'alqanot_api';

export function getApiBase() { return base; }
export async function loadApiBase() { try { await AsyncStorage.removeItem(K_API); } catch {} return base; }
export async function setApiBase(_v: string) { /* server hardcode — o'zgartirilmaydi */ }

export const store = {
  getToken: () => SecureStore.getItemAsync(K_TOKEN),
  setToken: (v: string | null) => (v ? SecureStore.setItemAsync(K_TOKEN, v) : SecureStore.deleteItemAsync(K_TOKEN)),
};

let onUnauth: (() => void) | null = null;
export function setUnauthHandler(fn: () => void) { onUnauth = fn; }

async function call(path: string, method: string, body?: any, withAuth = true): Promise<any> {
  const headers: any = { 'Content-Type': 'application/json' };
  if (withAuth) { const t = await store.getToken(); if (t) headers.Authorization = `Bearer ${t}`; }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20000);
  let res: Response;
  try {
    res = await fetch(base + path, { method, headers, body: body ? JSON.stringify(body) : undefined, signal: ctrl.signal });
  } catch { clearTimeout(timer); throw new Error('Internet aloqasi yo\'q'); }
  clearTimeout(timer);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && withAuth) { await store.setToken(null); if (onUnauth) onUnauth(); }
    throw new Error(json?.error || `Xato ${res.status}`);
  }
  return json;
}

export const api = {
  get: async <T = any>(p: string) => (await call(p, 'GET')).data as T,
  post: async <T = any>(p: string, b?: any) => (await call(p, 'POST', b)).data as T,
};

export async function signIn(phone: string, password: string) {
  const json = await call('/api/auth/login', 'POST', { phone, password }, false);
  const { token, user } = json.data || {};
  await store.setToken(token);
  return user;
}
