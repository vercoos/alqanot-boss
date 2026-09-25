import { io, Socket } from 'socket.io-client';
import * as Location from 'expo-location';
import { getApiBase, store } from './api';

let socket: Socket | null = null;
let watcher: Location.LocationSubscription | null = null;
let lastError: string | null = null;

export function getLocationError() { return lastError; }
export function getSocket(): Socket | null { return socket; }

async function ensureSocket(): Promise<Socket | null> {
  if (socket) return socket;
  const token = await store.getToken();
  if (!token) return null;
  socket = io(getApiBase(), { auth: { token }, transports: ['websocket'], reconnection: true });
  socket.on('connect_error', (e) => { lastError = 'Ulanish: ' + e.message; });
  return socket;
}

// Boshliq/bugalter — faqat tinglaydi (harita, tasdiqlash live yangilanadi).
export async function connectSocket(): Promise<Socket | null> {
  return ensureSocket();
}

// Kuryer — socket ulanadi + fonda GPS uzatiladi (harita YO'Q).
export async function startTracking() {
  lastError = null;
  await ensureSocket();
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') { lastError = 'Joylashuvga ruxsat berilmadi'; return; }
    if (watcher) return;
    watcher = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 15 },
      (pos) => {
        const c = pos.coords;
        socket?.emit('loc', { lat: c.latitude, lng: c.longitude, heading: c.heading ?? null, speed: c.speed ?? null });
      }
    );
  } catch (e: any) { lastError = e?.message || 'GPS xatosi'; }
}

export function stopTracking() {
  try { watcher?.remove(); } catch {}
  watcher = null;
}

export function disconnectSocket() {
  try { watcher?.remove(); } catch {}
  watcher = null;
  try { socket?.disconnect(); } catch {}
  socket = null;
}
