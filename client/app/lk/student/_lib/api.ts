export async function api<T=any>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api${path}`, {
    credentials: 'include',
    cache: 'no-store',
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init.body && !(init.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      ...(init.headers || {}),
    },
  });
  const text = await res.text().catch(()=>'');
  if (!res.ok) {
    try { throw new Error(JSON.parse(text)?.message || res.statusText); }
    catch { throw new Error(text || res.statusText); }
  }
  try { return JSON.parse(text) as T; } catch { return text as unknown as T; }
}
