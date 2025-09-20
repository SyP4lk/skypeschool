
'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { API, fetchJSON, Me } from '../../shared/lib/api';

function destByRole(role: Me['role']) {
  if (role === 'admin') return '/admin';
  if (role === 'teacher') return '/lk/teacher';
  return '/lk/student';
}

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const form = new URLSearchParams();
      form.set('identifier', identifier);
      form.set('password', password);
      const resp = await fetch(`${API}/auth/login`, { method: 'POST', body: form, credentials: 'include' });
      if (!resp.ok) throw new Error('login_failed');

      const me = await fetchJSON<Me>(`${API}/auth/me`);
      router.replace(destByRole(me.role));
    } catch (e: any) {
      setErr('Не удалось войти. Проверьте данные.');
    } finally {
      setLoading(false);
    }
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
        {err && <div className="text-sm text-red-600">{err}</div>}
      </form>
    </div>
  );
}
