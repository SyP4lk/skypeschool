// client/app/admin/_lib/api.ts
export async function api(path: string, init: RequestInit = {}) {
  const base = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api').replace(/\/+$/, '');
  const res = await fetch(`${base}${path}`, {
    credentials: 'include', // критично: шлём JWT-cookie
    // не перетираем поля из init — сначала init, затем наши дефолты и обратно заголовки:
    ...init,
    headers: {
      Accept: 'application/json',
      // Если body — строка (JSON), ставим content-type. Для FormData заголовок ставить не нужно.
      ...(typeof init.body === 'string' ? { 'Content-Type': 'application/json' } : {}),
      ...(init.headers || {}),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    try {
      const j = JSON.parse(text);
      throw new Error(j?.message || text || res.statusText);
    } catch {
      throw new Error(text || res.statusText);
    }
  }
  return res.status === 204 ? null : res.json();
}
