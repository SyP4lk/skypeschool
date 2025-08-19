// client/app/admin/_lib/api.ts
export async function api<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const base = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api').replace(/\/+$/, '');

  const res = await fetch(`${base}${path}`, {
    credentials: 'include', // отправляем cookie token
    cache: 'no-store',
    ...init,
    headers: {
      Accept: 'application/json',
      // Если body строка (JSON) — ставим content-type.
      ...(typeof init.body === 'string' ? { 'Content-Type': 'application/json' } : {}),
      ...(init.headers || {}),
    },
  });

  if (res.status === 204) return null as T;

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    try {
      const j = JSON.parse(text);
      throw new Error(j?.message || res.statusText);
    } catch {
      throw new Error(text || res.statusText);
    }
  }

  return res.json() as Promise<T>;
}
