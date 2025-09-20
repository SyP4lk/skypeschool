'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/shared/ui/Toast';

const API = (process.env.NEXT_PUBLIC_API_URL || '/api').replace(/\/$/, '');

export default function LoginPage() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const router = useRouter();

  async function warmup() { try { await fetch(`${API}/health`, { credentials: 'include' }); } catch {} }

  async function doLogin() {
    const form = new URLSearchParams();
    form.set('login', login);
    form.set('password', password);
    return fetch(`${API}/auth/login`, { method: 'POST', body: form, credentials: 'include' });
  }

  async function fetchMe() {
    try { const r = await fetch(`${API}/auth/me`, { credentials: 'include' }); if (!r.ok) return null; return await r.json(); } catch { return null; }
  }

  async function redirectByRole() {
    const me = await fetchMe();
    const role = me?.role || me?.user?.role;
    if (role === 'student') router.replace('/lk/student');
    else if (role === 'teacher') router.replace('/lk/teacher');
    else router.replace('/admin');
  }

  async function onSubmit(e: any) {
    e.preventDefault();
    setLoading(true);
    await warmup();
    let resp = await doLogin().catch(() => null);
    if (!resp || !resp.ok) {
      await new Promise(r => setTimeout(r, 1000));
      resp = await doLogin().catch(() => null);
    }
    if (!resp || !resp.ok) {
      toast({ type: 'error', message: 'Не удалось войти. Проверьте данные.' });
      setLoading(false);
      return;
    }
    toast({ type: 'success', message: 'Вход выполнен' });
    await redirectByRole();
    setLoading(false);
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-xl font-semibold mb-4">Вход</h1>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <div>
          <label className="text-sm block mb-1">Логин / Email / Телефон</label>
          <input className="w-full rounded border p-2" value={login} onChange={e=>setLogin(e.target.value)} required />
        </div>
        <div>
          <label className="text-sm block mb-1">Пароль</label>
          <input type="password" className="w-full rounded border p-2" value={password} onChange={e=>setPassword(e.target.value)} required />
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
