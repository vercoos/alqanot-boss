import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

const extra: any = Constants.expoConfig?.extra || {};
const apiRoot: string = extra.apiRoot || 'http://72.60.17.70:6010';       // EL QANOT backend (login)
const apiBase: string = extra.apiBase || 'http://72.60.17.70:6010/app-api'; // companion (boss endpointlari)
const K_TOKEN = 'elqanot-token';

export const store = {
  getToken: () => SecureStore.getItemAsync(K_TOKEN),
  setToken: (v: string | null) => v ? SecureStore.setItemAsync(K_TOKEN, v) : SecureStore.deleteItemAsync(K_TOKEN),
};

// socket.io shu ildizga ulanadi (companion emas)
export function getApiBase() { return apiRoot; }

let onUnauth: (() => void) | null = null;
export function setUnauthHandler(fn: () => void) { onUnauth = fn; }

async function call<T = any>(full: string, method: string, body?: any, withAuth = true): Promise<any> {
  const headers: any = { 'Content-Type': 'application/json' };
  if (withAuth) { const t = await store.getToken(); if (t) headers.Authorization = `Bearer ${t}`; }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20000);
  let res: Response;
  try { res = await fetch(full, { method, headers, body: body ? JSON.stringify(body) : undefined, signal: ctrl.signal }); }
  catch { clearTimeout(timer); throw new Error('Internet aloqasi yo\'q'); }
  clearTimeout(timer);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && withAuth) { await store.setToken(null); if (onUnauth) onUnauth(); }
    const e: any = new Error(json?.error || json?.message || `Xato ${res.status}`); e.status = res.status; throw e;
  }
  return json;
}

// companion (/app-api) — {ok, data} qaytaradi
export const api = {
  apiBase, apiRoot,
  get: async <T = any>(p: string) => (await call(apiBase + p, 'GET')).data as T,
  post: async <T = any>(p: string, b?: any) => (await call(apiBase + p, 'POST', b)).data as T,
  del: async <T = any>(p: string) => (await call(apiBase + p, 'DELETE')).data as T,
  // AL QANOT ildiz /api endpointlari (xarita: kuryerlar, ombor)
  rootGet: async <T = any>(p: string) => (await call(apiRoot + p, 'GET')).data as T,
  rootPost: async <T = any>(p: string, b?: any) => (await call(apiRoot + p, 'POST', b)).data as T,
};

// EL QANOT auth — email YOKI telefon + parol
export async function signIn(email: string, password: string) {
  const r = await call(`${apiRoot}/api/auth/login`, 'POST', { email, password }, false);
  const c = r.data || r;
  const token = c.token;
  const u = c.user || {};
  if (!token) throw new Error('Token olinmadi');
  await store.setToken(token);
  return { token, user: { ...u, name: u.full_name, firstName: u.full_name } };
}
