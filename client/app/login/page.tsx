'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const API = (process.env.NEXT_PUBLIC_API_URL || '/api').replace(/\/$/, '');

type Me = { id: string; role?: string | null; login?: string | null; firstName?: string | null };

function normRole(v: string | null | undefined): 'student' | 'teacher' | 'admin' | 'other' {
  const s = String(v ?? '').trim().toLowerCase();
  if (['teacher', 'преподаватель', 'teach', 't'].includes(s)) return 'teacher';
  if (['student', 'ученик', 'stud', 's'].includes(s)) return 'student';
  if (['admin', 'administrator', 'a'].includes(s)) return 'admin';
  return 'other';
}

export default function LoginPage() {
  const router = useRouter();
  const [loginOrEmail, setLoginOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // На всякий случай удаляем возможную "клиентскую" token-куку (серверную HttpOnly это не тронет)
  useEffect(() => {
    try { document.cookie = 'token=; Path=/; Max-Age=0; SameSite=None; Secure'; } catch {}
  }, []);

  const onSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!loginOrEmail || !password) {
      setError('Введите логин или email и пароль.');
      return;
    }

    setBusy(true);
    try {
      // прогрев бекенда (не ждём)
      fetch(API.replace(/\/api$/, ''), { credentials: 'include' }).catch(() => {});

      // urlencoded без явного Content-Type — чтобы не ловить preflight на Render
      const body = new URLSearchParams();
      body.append('loginOrEmail', loginOrEmail);
      body.append('password', password);

      const r = await fetch(`${API}/auth/login`, {
        method: 'POST',
        body,
        credentials: 'include',
      });

      if (!r.ok) {
        setError('Неверный логин или пароль.');
        return;
      }

      const meRes = await fetch(`${API}/auth/me`, { credentials: 'include' });
      if (!meRes.ok) {
        setError('Не удалось получить профиль. Попробуйте ещё раз.');
        return;
      }
      const me: Me = await meRes.json();
      const role = normRole(me?.role);

      if (role === 'admin') router.replace('/admin');
      else if (role === 'teacher') router.replace('/lk/teacher');
      else router.replace('/lk/student'); // по умолчанию студент
    } catch {
      setError('Не удалось войти. Попробуйте позже.');
    } finally {
      setBusy(false);
    }
  }, [loginOrEmail, password, router]);

  return (
    <div className="min-h-[60vh] flex items-start justify-center">
      <div className="w-full max-w-md p-6">
        <h1 className="text-2xl font-semibold mb-4">Вход</h1>

        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <input
            name="loginOrEmail"
            value={loginOrEmail}
            onChange={e => setLoginOrEmail(e.target.value)}
            className="border rounded px-3 py-2"
            placeholder="Логин или Email"
            autoComplete="username"
          />

          <input
            name="password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="border rounded px-3 py-2"
            placeholder="Пароль"
            autoComplete="current-password"
          />

          <button
            type="submit"
            disabled={busy}
            className="mt-2 rounded px-4 py-2 bg-black text-white disabled:opacity-60"
          >
            {busy ? 'Входим…' : 'Войти'}
          </button>

          {error && <div className="text-red-600 text-sm">{error}</div>}
        </form>
      </div>
    </div>
  );
}
