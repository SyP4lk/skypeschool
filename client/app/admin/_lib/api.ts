// client/app/admin/_lib/api.ts
// Простая fetch-функция для АДМИНКИ: всегда префиксует путь /admin
export async function api<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const base = '';
  const p = path.startsWith('/admin') ? path : `/admin${path.startsWith('/') ? path : `/${path}`}`;

  const res = await fetch(`${base}/api${p}`, {
    credentials: 'include',
    cache: 'no-store',
    ...init,
    headers: {
      Accept: 'application/json',
      ...(typeof init.body === 'string' ? { 'Content-Type': 'application/json' } : {}),
      ...(init.headers || {}),
    },
  });

  if (res.status === 204) return null as T;

  const ct = res.headers.get('content-type') || '';
  const text = await res.text().catch(() => '');

  if (!res.ok) {
    if (ct.includes('application/json')) {
      try { throw new Error(JSON.parse(text)?.message || res.statusText); } catch {}
    }
    throw new Error(text || res.statusText);
  }

  if (ct.includes('application/json')) return JSON.parse(text) as T;
  return text as unknown as T;
}
