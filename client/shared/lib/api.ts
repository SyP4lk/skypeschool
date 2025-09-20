
// Simple API helper with credentials included
export const API = (process.env.NEXT_PUBLIC_API_URL || '/api').replace(/\/$/, '');

export async function fetchJSON<T=any>(url: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(url, { credentials: 'include', cache: 'no-store', ...init });
  if (!res.ok) {
    const msg = await res.text().catch(()=>String(res.status));
    throw new Error(msg || String(res.status));
  }
  return res.json() as Promise<T>;
}

export type Me = {
  id: string;
  role: 'admin'|'teacher'|'student';
  login?: string|null;
  firstName?: string|null;
  lastName?: string|null;
};
