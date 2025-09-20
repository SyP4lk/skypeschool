'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const API = (process.env.NEXT_PUBLIC_API_URL || '/api').replace(/\/$/, '');

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string|null>(null);
  const [msg, setMsg] = useState<string|null>(null);
  const router = useRouter();

  async function warmup() {
    try { await fetch(`${API}/health`, { credentials: 'include' }); } catch {}
  }

  async function doLogin() {
    const form = new URLSearchParams();
    form.set('identifier', identifier);
    form.set('password', password);
    return fetch(`${API}/auth/login`, {
      method: 'POST',
      body: form,           // x-www-form-urlencoded
      credentials: 'include',
    });
  }

  async function fetchMe() {
    try {
      const r = await fetch(`${API}/auth/me`, { credentials: 'include' });
      if (!r.ok) return null;
      return await r.json();
    } catch { return null; }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setMsg(null); setLoading(true);
    await warmup();
    let resp: Response | null = null;
    try { resp = await doLogin(); } catch {}
    if (!resp || !resp.ok) {
      await new Promise(r => setTimeout(r, 1200));
      try { resp = await doLogin(); } catch {}
    }
    if (!resp || !resp.ok) {
      setErr('Не удалось войти. Проверьте данные.');
      setLoading(false);
      return;
    }
    setMsg('Успешный вход');
    const me = await fetchMe();
    const role = (me?.role) || (me?.user?.role) || (me?.data?.role);
    if (role === 'admin') router.replace('/admin/finance');
    else if (role === 'teacher') router.replace('/lk/teacher');
    else router.replace('/lk/student');
    setLoading(false);
  }

  return (
    <div className="max-w-md mx-auto py-10">
      <h1 className="text-xl font-semibold mb-4">Вход</h1>
      {err && <div className="mb-3 px-3 py-2 rounded border border-rose-300 bg-rose-50 text-rose-800">{err}</div>}
      {msg && <div className="mb-3 px-3 py-2 rounded border border-green-300 bg-green-50 text-green-800">{msg}</div>}
      <form className="space-y-3" onSubmit={onSubmit}>
        <div>
          <label className="text-sm block mb-1">Логин / Email / Телефон</label>
          <input className="w-full rounded border px-3 py-2" value={identifier} onChange={e=>setIdentifier(e.target.value)} required />
        </div>
        <div>
          <label className="text-sm block mb-1">Пароль</label>
          <input type="password" className="w-full rounded border px-3 py-2" value={password} onChange={e=>setPassword(e.target.value)} required />
        </div>
        <button className="px-4 py-2 rounded border bg-blue-600 text-white disabled:opacity-60" disabled={loading}>
          {loading ? 'Входим…' : 'Войти'}
        </button>
      </form>
    </div>
  );
}
