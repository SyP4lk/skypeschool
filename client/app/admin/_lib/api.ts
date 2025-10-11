'use client';

// Универсальная обёртка над админ-API с дженериком и автопрефиксами.
// Понимает FormData (не проставляет Content-Type), JSON, и прокидывает cookie.

export async function api<T = any>(path: string, init: RequestInit = {}) {
  // Если явно задан абсолютный урл — используем его как есть.
  const isAbsolute = /^https?:\/\//i.test(path);

  // База:
  // - если в NEXT_PUBLIC_API_URL лежит абсолютный URL → используем его (редкий случай)
  // - иначе всегда шлём через прокси Next на этом же домене: /api
  const envBase = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '');
  const base =
    envBase && /^https?:\/\//i.test(envBase)
      ? envBase
      : '/api';

  // Нормализуем относительный путь, добавляем /admin если нужно
  let rel = path.startsWith('/') ? path : `/${path}`;
  if (!isAbsolute && !rel.startsWith('/admin/')) {
    rel = `/admin${rel}`;
  }

  const url = isAbsolute ? path : `${base}${rel}`;

  const headers = new Headers(init.headers || {});
  const hasBody = init.body !== undefined;
  const isFormData = typeof FormData !== 'undefined' && init.body instanceof FormData;
  if (hasBody && !isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
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
