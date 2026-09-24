import { io, Socket } from 'socket.io-client';
import { getApiBase, store } from './api';

let socket: Socket | null = null;

// Boshliq login qilgach chaqiriladi — bitta doimiy ulanish (reconnect saqlaydi).
export async function connectSocket(): Promise<Socket | null> {
  if (socket) return socket;
  const token = await store.getToken();
  if (!token) return null;
  socket = io(getApiBase(), { auth: { token }, transports: ['websocket'], reconnection: true });
  return socket;
}

export function getSocket(): Socket | null { return socket; }

export function disconnectSocket() {
  try { socket?.disconnect(); } catch {}
  socket = null;
}
