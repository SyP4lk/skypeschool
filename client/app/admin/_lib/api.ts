// PATCH: 2025-09-28
export async function api(path: string, init?: RequestInit) {
  // База API: env или жёсткий фолбэк на локальный бэк
  const envBase = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');
  const base = envBase || 'http://localhost:3001/api';

  // Собираем абсолютный URL
  const url = `${base}${path.startsWith('/') ? path : `/${path}`}`;

  // Временный лог — поможет убедиться, что идём на :3001
  // console.debug('[api] →', url);

  const headers = new Headers(init?.headers || {});
  if (!headers.has('Content-Type') && init?.body) headers.set('Content-Type', 'application/json');

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
    throw new Error(msg);
  }
  return data;
}
