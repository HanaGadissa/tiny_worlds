export interface Item { key: string; name: string; emoji: string; category: string; price: number; tag: string }
export interface Obj { id: string; key: string; x: number; y: number; rotation: number; scale: number }
export interface Challenge { id: number; title: string; description: string; budget: number; required: Record<string, number> }
export interface Room { id?: number; name: string; theme: string; wallpaper: string; floorColor: string; floorPattern: string; challengeId: number | null; objects: Obj[] }
export interface RoomSummary { id: number; name: string; theme: string; updatedAt: string }

let token = localStorage.getItem('tw_token') || '';
export const setToken = (t: string, u = '') => {
  token = t;
  if (t) { localStorage.setItem('tw_token', t); localStorage.setItem('tw_user', u); }
  else { localStorage.removeItem('tw_token'); localStorage.removeItem('tw_user'); }
};
export const hasToken = () => !!token;

async function req<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const r = await fetch('/api' + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || 'Request failed');
  return data as T;
}
export const api = {
  auth: (mode: 'login' | 'register', username: string, password: string) => req<{ token: string; username: string }>(`/auth/${mode}`, 'POST', { username, password }),
  catalog: () => req<Item[]>('/catalog'),
  challenges: () => req<Challenge[]>('/challenges'),
  rooms: () => req<RoomSummary[]>('/rooms'),
  room: (id: number) => req<Room>(`/rooms/${id}`),
  create: (r: Room) => req<Room>('/rooms', 'POST', r),
  update: (id: number, r: Room) => req<Room>(`/rooms/${id}`, 'PUT', r),
  remove: (id: number) => req(`/rooms/${id}`, 'DELETE'),
};
