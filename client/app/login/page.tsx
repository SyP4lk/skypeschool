'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useToast } from '@/shared/ui/Toast';

const API = (process.env.NEXT_PUBLIC_API_URL || '/api').replace(/\/$/, '');

async function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function warmupServer(): Promise<boolean> {
  // серия попыток будить сервер: / (HEAD/GET) и /api/health
  const endpoints = [
    { url: `${API.replace(/\/api$/, '')}/`, opts: { method: 'HEAD', credentials: 'include' as const } },
    { url: `${API.replace(/\/api$/, '')}/`, opts: { method: 'GET',  credentials: 'include' as const } },
    { url: `${API}/health`,                 opts: { method: 'GET',  credentials: 'include' as const } },
  ];
  for (let attempt = 0; attempt < 10; attempt++) {
    try {
      for (const ep of endpoints) {
        const r = await fetch(ep.url, ep.opts);
        if (r && r.status !== 503) return true; // сервер проснулся
      }
    } catch {}
    // экспоненциальная пауза: 500ms → 1s → 2s → 4s → …
    await sleep(Math.min(500 * Math.pow(2, attempt), 4000));
  }
  return false;
}

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const toast = useToast();
  const router = useRouter();

  async function doLoginOnce() {
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

    // 1) Многошаговый прогрев (ждём пока Render «проснётся»)
    const awake = await warmupServer();
    if (!awake) {
      toast({ type: 'error', message: 'Сервер просыпается слишком долго. Повторите попытку.' });
      setLoading(false);
      return;
    }

    // 2) Логин с ретраями, если вдруг 503 ещё кешируется
    let resp: Response | null = null;
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        resp = await doLoginOnce();
        if (resp && resp.status !== 503) break;
      } catch {}
      await sleep(800 + attempt * 400);
    }

    if (!resp || !resp.ok) {
      toast({ type: 'error', message: 'Не удалось войти. Проверьте данные или попробуйте позже.' });
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
          {loading ? 'Подключаемся…' : 'Войти'}
        </button>
      </form>
    </div>
  );
}
