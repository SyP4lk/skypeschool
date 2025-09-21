// SSR helpers for Next.js 15 (App Router)
import { headers } from 'next/headers';

/** Build absolute URL to this app using request headers */
export async function getAppUrlSSR() {
  const h = await headers();
  const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:3001';
  const proto = h.get('x-forwarded-proto') || (process.env.NEXT_PUBLIC_APP_URL?.startsWith('https') ? 'https' : 'http') || 'http';
  return `${proto}://${host}`.replace(/\/$/, '');
}

/** Server-side fetch to our local Next proxy API with forwarded cookies */
export async function ssrApiJson<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const base = await getAppUrlSSR();
  const url = base + '/api' + (path.startsWith('/') ? path : '/' + path);
  const h = await headers();
  const cookie = h.get('cookie') || '';

  const res = await fetch(url, {
    cache: 'no-store',
    headers: { ...(init.headers || {}), cookie },
    ...init,
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${txt || res.statusText}`);
  }
  return res.json() as Promise<T>;
}
