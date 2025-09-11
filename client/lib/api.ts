// Unified API helpers (proxy-first).
// Safe in Next 15 for both RSC and client (no sync headers()).
// Exports: api, apiPublic, apiJson, fmtRub, dt

export type ApiInit = RequestInit & { json?: any };

// Base URL of THIS Next app for server-side absolute URLs.
// Dev default: http://localhost:3001
const APP_URL =
  (typeof process !== 'undefined' && (process as any).env?.NEXT_PUBLIC_APP_URL) ||
  'http://localhost:3001';

function toPath(path: string) {
  return path.startsWith('/') ? path : '/' + path;
}

function makeUrl(path: string, isServer: boolean) {
  const p = toPath(path);
  if (isServer) return APP_URL.replace(/\/$/, '') + '/api' + p;
  return '/api' + p;
}

export async function api(path: string, init: ApiInit = {}) {
  const isServer = typeof window === 'undefined';
  const url = makeUrl(path, isServer);

  const headers = new Headers(init.headers || {});
  if (init.json !== undefined && !headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }

  const res = await fetch(url, {
    cache: 'no-store',
    credentials: 'include',
    ...init,
    headers,
    body: init.json !== undefined ? JSON.stringify(init.json) : init.body,
  });

  return res;
}

// Back-compat alias
export const apiPublic = api;

export async function apiJson<T = any>(path: string, init: ApiInit = {}): Promise<T> {
  const res = await api(path, init);
  if (!res.ok) {
    let msg = '';
    try { msg = await res.text(); } catch {}
    throw new Error(`API ${res.status}: ${msg || res.statusText}`);
  }
  return res.json() as Promise<T>;
}

// Money formatting
export function fmtRub(value: number | bigint): string {
  try {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(Number(value || 0));
  } catch {
    return `${value} ₽`;
  }
}

// Date/time tiny helper
type AnyDate = string | number | Date | undefined;
function coerceDate(x?: AnyDate): Date { return x instanceof Date ? x : new Date(x ?? Date.now()); }
function _fmtDate(d: Date, opts?: Intl.DateTimeFormatOptions) { return d.toLocaleDateString(undefined, opts); }
function _fmtTime(d: Date, opts?: Intl.DateTimeFormatOptions) {
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', ...opts });
}
function _fmtDateTime(d: Date, opts?: Intl.DateTimeFormatOptions) {
  return d.toLocaleString(undefined, { hour: '2-digit', minute: '2-digit', ...opts });
}
function _tz() { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'local'; } catch { return 'local'; } }

const _dtCallable = ((x?: AnyDate) => {
  const d = coerceDate(x);
  return {
    date: () => _fmtDate(d),
    time: () => _fmtTime(d),
    datetime: () => _fmtDateTime(d),
    fmtDate: () => _fmtDate(d),
    fmtTime: () => _fmtTime(d),
    fmtDateTime: () => _fmtDateTime(d),
    tz: () => _tz(),
    tzSuffix: () => `(${_tz()})`,
    toLocalISO: () => {
      const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
      return z.toISOString().slice(0,16);
    },
  };
}) as any;

_dtCallable.fmtDate = (x?: AnyDate) => _fmtDate(coerceDate(x));
_dtCallable.fmtTime = (x?: AnyDate) => _fmtTime(coerceDate(x));
_dtCallable.fmtDateTime = (x?: AnyDate) => _fmtDateTime(coerceDate(x));
_dtCallable.tz = () => _tz();
_dtCallable.tzSuffix = () => `(${_tz()})`;

export const dt: any = _dtCallable;
