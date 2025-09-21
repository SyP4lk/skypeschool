'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const API = (process.env.NEXT_PUBLIC_API_URL || '/api').replace(/\/$/, '');

export default function LoginPage() {
  const router = useRouter();
  const [ident, setIdent] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string|null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setLoading(true);
    try {
      const body = new URLSearchParams();
      body.set('loginOrEmail', ident);
      body.set('password', password);
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        body,
        credentials: 'include',
        cache: 'no-store',
      });
      const text = await res.text().catch(()=>'');
      if (!res.ok) {
        let msg = '';
        try { msg = JSON.parse(text)?.message || res.statusText; } catch { msg = text || res.statusText; }
        throw new Error(msg);
      }
      const me = await fetch(`${API}/auth/me`, { credentials: 'include', cache: 'no-store' }).then(r=>r.json());
      const role = String(me?.role || '').toLowerCase();
      if (role === 'admin') router.push('/admin');
      else if (role === 'teacher') router.push('/lk/teacher');
      else router.push('/lk/student');
    } catch (e:any) {
      setErr(e?.message || 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto max-w-md py-6">
      <h1 className="text-xl font-semibold mb-4">Вход</h1>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <div>
          <label className="text-sm block mb-1">Логин / Email / Телефон</label>
          <input className="w-full rounded border px-3 py-2" value={ident} onChange={e=>setIdent(e.target.value)} required />
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
        Нет аккаунта? <a href="/register" className="text-blue-600 hover:underline">Зарегистрироваться</a>
      </div>
      {err && <div className="mt-4 text-sm text-red-600">{err}</div>}
    </div>
  );
}
