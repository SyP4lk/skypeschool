'use client';

// Единый безопасный хелпер для админ-запросов. Всегда идём через /api на этом же домене,
// чтобы фронтовая cookie корректно прокидывалась к бэкенду.
export async function api<T = any>(path: string, init: RequestInit = {}) {
  const isAbsolute = /^https?:\/\//i.test(path);
  const base = '/api';

  let rel = path.startsWith('/') ? path : `/${path}`;
  if (!isAbsolute && !rel.startsWith('/admin/')) rel = `/admin${rel}`;

  const url = isAbsolute ? path : `${base}${rel}`;

  const headers = new Headers(init.headers || {});
  if (!(init.body instanceof FormData) && !headers.has('content-type')) {
    headers.set('content-type', 'application/json; charset=utf-8');
  }

  const res = await fetch(url, {
    ...init,
    headers,
    credentials: 'include',
    cache: 'no-store',
  });

  const text = await res.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text || null; }

  if (!res.ok) {
    const msg = (data && (data.message || data.error)) || text || `HTTP ${res.status}`;
    throw new Error(String(msg));
  }
  return data as T;
}
