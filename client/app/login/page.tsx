// PATCH: 2025-09-29 — логин через локальный BFF (/api/auth/*)

'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

function redirectByRole(router: ReturnType<typeof useRouter>, role?: string) {
  const r = String(role || '').toLowerCase();
  if (r === 'admin') router.push('/admin');
  else if (r === 'teacher') router.push('/lk/teacher');
  else router.push('/lk/student');
}

export default function LoginPage() {
  const router = useRouter();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function fetchMe() {
    const res = await fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' });
    if (!res.ok) return null;
    try { return await res.json(); } catch { return null; }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ login: login.trim(), password }),
      });

      let j: any = null; try { j = await res.json(); } catch {}
      if (!res.ok) throw new Error(j?.message || `HTTP ${res.status}`);

      const me = await fetchMe();
      redirectByRole(router, me?.user?.role ?? me?.role);
    } catch (e: any) {
      setErr(e?.message || 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto py-10">
      <h1 className="text-xl font-semibold mb-4">Вход</h1>

      {err && (
        <div className="mb-3 px-3 py-2 rounded border border-rose-300 bg-rose-50 text-rose-800">
          {err}
        </div>
      )}

      <form className="space-y-3" onSubmit={onSubmit}>
        <div>
          <label className="text-sm block mb-1">Логин или email</label>
          <input
            className="w-full rounded border px-3 py-2"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="text-sm block mb-1">Пароль</label>
          <input
            type="password"
            className="w-full rounded border px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button
          className="px-4 py-2 rounded border bg-blue-600 text-white disabled:opacity-60"
          disabled={loading}
          type="submit"
        >
          {loading ? 'Входим…' : 'Войти'}
        </button>
      </form>

      <div className="mt-4 text-sm">
        Нет аккаунта?{' '}
        <Link href="/register" className="text-blue-600 hover:underline">
          Зарегистрироваться
        </Link>
      </div>
    </div>
  );
}
