'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useToast } from '@/shared/ui/Toast';

const API = (process.env.NEXT_PUBLIC_API_URL || '/api').replace(/\/$/, '');

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const toast = useToast();
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
      body: form,
      credentials: 'include',
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await warmup();
    let resp: Response | null = null;
    try { resp = await doLogin(); } catch {}
    if (!resp || !resp.ok) {
      await new Promise(r => setTimeout(r, 900));
      try { resp = await doLogin(); } catch {}
    }
    if (!resp || !resp.ok) {
      toast({ type: 'error', message: 'Не удалось войти. Проверьте данные.' });
      setLoading(false);
      return;
    }
    const me = await fetch(`${API}/auth/me`, { credentials: 'include' }).then(r => r.ok ? r.json() : null);
    const role = me?.role;
    if (role === 'student') router.replace('/lk/student');
    else if (role === 'teacher') router.replace('/lk/teacher');
    else router.replace('/admin');
    toast({ type: 'success', message: 'Вход выполнен' });
    setLoading(false);
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-xl font-semibold mb-4">Вход</h1>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <input required placeholder="Логин / Email / Телефон"
               value={identifier} onChange={e=>setIdentifier(e.target.value)}
               className="border rounded p-2" />
        <input required type="password" placeholder="Пароль"
               value={password} onChange={e=>setPassword(e.target.value)}
               className="border rounded p-2" />
        <button disabled={loading} className="rounded bg-black text-white py-2">
          {loading ? 'Входим…' : 'Войти'}
        </button>
      </form>
    </div>
  );
}
