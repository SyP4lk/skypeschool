'use client';

// Универсальная обёртка над админ-API с дженериком и автопрефиксами.
// Понимает FormData (не проставляет Content-Type), JSON, и прокидывает cookie.

export async function api<T = any>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  // База бэка (обычно с /api на конце), либо локально
  const envBase = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '');
  const base = envBase || 'http://localhost:3001/api';

  // Если передали абсолютный URL — не трогаем
  const isAbsolute = /^https?:\/\//i.test(path);

  // Нормализуем относительный путь:
  //  - гарантируем ведущий слэш
  //  - если путь не начинается с /admin — добавим /admin (для админки)
  let rel = path.startsWith('/') ? path : `/${path}`;
  if (!isAbsolute && !rel.startsWith('/admin/')) {
    rel = `/admin${rel}`;
  }

  // Конечный URL
  const url = isAbsolute ? path : `${base}${rel}`;

  // Заголовки: Content-Type ставим только если есть body И это не FormData
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
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text || null;
  }

  if (!res.ok) {
    const msg = (data && (data.message || data.error)) || text || `HTTP ${res.status}`;
    throw new Error(String(msg));
  }

  return data as T;
}
