'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const API_BASE = '';

async function api(path: string, init: RequestInit = {}) {
  const res = await fetch(`${API_BASE}/api${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
    credentials: 'include',
    cache: 'no-store',
  });
  const txt = await res.text().catch(()=>'');
  let data: any = null;
  try { data = txt ? JSON.parse(txt) : null; } catch {}
  if (!res.ok) throw new Error((data && (data.message || data.error)) || txt || `HTTP ${res.status}`);
  return data;
}

// Try to fetch current user from likely endpoints
async function fetchMe(): Promise<any|null> {
  const tryUrls = ['/auth/me', '/users/me', '/me'];
  for (const url of tryUrls) {
    try {
      const me = await api(url, { method: 'GET' });
      if (me) return me;
    } catch (_e) {}
  }
  return null;
}

function redirectByRole(router: ReturnType<typeof useRouter>, role?: string) {
  const r = String(role || '').toLowerCase();
  if (r === 'admin') router.push('/admin/finance');
  else if (r === 'teacher') router.push('/lk/teacher');
  else router.push('/lk/student');
}

export default function LoginPage() {
  const router = useRouter();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string|null>(null);
  const [msg, setMsg] = useState<string|null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: any) => {
    e.preventDefault();
    setErr(null); setMsg(null); setLoading(true);
    try {
      await api('/auth/login', { method: 'POST', body: JSON.stringify({ login, password }) });
      // try to detect role and redirect
      const me = await fetchMe();
      const role = (me?.role) || (me?.user?.role) || (me?.data?.role);
      setMsg('Успешный вход');
      redirectByRole(router, role);
    } catch (e:any) {
      setErr(e?.message || 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-10">
      <h1 className="text-xl font-semibold mb-4">Вход</h1>
      {err && <div className="mb-3 px-3 py-2 rounded border border-rose-300 bg-rose-50 text-rose-800">{err}</div>}
      {msg && <div className="mb-3 px-3 py-2 rounded border border-green-300 bg-green-50 text-green-800">{msg}</div>}
      <form className="space-y-3" onSubmit={onSubmit}>
        <div>
          <label className="text-sm block mb-1">Логин или email</label>
          <input className="w-full rounded border px-3 py-2" value={login} onChange={e=>setLogin(e.target.value)} required />
        </div>
        <div>
          <label className="text-sm block mb-1">Пароль</label>
          <input type="password" className="w-full rounded border px-3 py-2" value={password} onChange={e=>setPassword(e.target.value)} required />
        </div>
        <button className="px-4 py-2 rounded border bg-blue-600 text-white disabled:opacity-60" disabled={loading}>
          {loading ? 'Входим…' : 'Войти'}
        </button>
      </form>
      <div className="mt-4 text-sm">
        Нет аккаунта? <Link href="/register" className="text-blue-600 hover:underline">Зарегистрироваться</Link>
      </div>
    </div>
  );
}
