'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [login, setLogin] = useState('admin');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    const api = process.env.NEXT_PUBLIC_API_URL!;
    try {
       const form = new URLSearchParams();
  form.set('login', login);
  form.set('password', password);

  const res = await fetch(`${api}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    credentials: 'include',
   body: form.toString(),
  });
      if (!res.ok) throw new Error(await res.text());
      try {
        const me = await fetch(`${api}/auth/me`, { credentials: 'include' });
        const data = me.ok ? await me.json() : null;
        const role = data?.role ?? 'student';
        if (role === 'admin') router.push('/admin');
        else if (role === 'teacher') router.push('/teacher');
        else router.push('/student');
      } catch {
        router.push('/student');
      }
    } catch (e: any) {
      setErr(e.message ?? 'Ошибка входа');
    }
  };

  return (
    <main className="p-6 max-w-sm mx-auto">
      <h1 className="text-xl font-semibold mb-4">Вход</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="block text-sm mb-1">Логин</label>
          <input value={login} onChange={e=>setLogin(e.target.value)}
            className="w-full border rounded px-3 py-2" placeholder="admin" />
        </div>
        <div>
          <label className="block text-sm mb-1">Пароль</label>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)}
            className="w-full border rounded px-3 py-2" />
        </div>
        {err && <div className="text-sm text-red-600">{err}</div>}
        <button className="px-4 py-2 rounded bg-black text-white">Войти</button>
      </form>
      <div className="mt-4 text-sm">
        Ещё нет аккаунта? <a href="/signup" className="text-blue-600 underline">Регистрация ученика</a>
      </div>
    </main>
  );
}
