'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

const API = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, ''); // https://skypeschool-server.onrender.com/api
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Прогрев: GET на существующий публичный роут (без preflight)
async function warmUp() {
  try {
    await fetch(`${API}/teachers?limit=1`, { cache: 'no-store', keepalive: true, mode: 'cors' });
  } catch {}
}

async function fetchWithRetry(input: RequestInfo | URL, init: RequestInit, retries = 3) {
  let last: any;
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(input, init);
      if (res.status !== 503) return res;
      last = new Error('503 Service Unavailable');
    } catch (e) {
      last = e;
    }
    await sleep(800 * (i + 1));
  }
  throw last;
}

export default function LoginPage() {
  const router = useRouter();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>('');
  const [ok, setOk] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setOk(false);

    try {
      await warmUp();
      await sleep(300);

      // urlencoded без явного Content-Type -> без preflight
      const body = new URLSearchParams({
        loginOrEmail: login,
        login,
        password,
      });

      const res = await fetchWithRetry(`${API}/auth/login`, {
        method: 'POST',
        credentials: 'include',
        body,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Ошибка входа (${res.status})`);
      }

      setOk(true);

      // Узнаём роль и уводим в нужный раздел
      let role: string | undefined;
      try {
        const me = await fetch(`${API}/auth/me`, { credentials: 'include', cache: 'no-store' });
        if (me.ok) role = (await me.json())?.role;
      } catch {}

      router.replace(
        role === 'admin' ? '/admin' :
        role === 'teacher' ? '/lk/teacher' :
        role === 'student' ? '/lk/student' : '/'
      );
    } catch (e: any) {
      setError(e?.message || 'Не удалось выполнить вход');
    }
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Вход</h1>

      {ok && <div className="mb-3 rounded bg-green-100 text-green-800 px-3 py-2">Успешный вход</div>}
      {error && <div className="mb-3 rounded bg-red-100 text-red-800 px-3 py-2">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block mb-1">Логин или email</label>
          <input className="border p-2 w-full" value={login} onChange={(e) => setLogin(e.target.value)} required />
        </div>
        <div>
          <label className="block mb-1">Пароль</label>
          <input type="password" className="border p-2 w-full" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded" type="submit">Войти</button>
      </form>
    </div>
  );
}
