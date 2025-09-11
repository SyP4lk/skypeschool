'use client';
import { useState } from 'react';
import Link from 'next/link';

const API_BASE = '';

async function api(path: string, init: RequestInit = {}) {
  const res = await fetch(`${API_BASE}/api${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  const txt = await res.text().catch(()=>'');
  let data: any = null;
  try { data = txt ? JSON.parse(txt) : null; } catch {}
  if (!res.ok) throw new Error((data && (data.message || data.error)) || txt || `HTTP ${res.status}`);
  return data;
}

export default function RegisterPage() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [err, setErr] = useState<string|null>(null);
  const [msg, setMsg] = useState<string|null>(null);

  const onSubmit = async (e: any) => {
    e.preventDefault();
    setErr(null); setMsg(null);
    try {
      if (!login || !password || !phone || !email) throw new Error('Заполните все поля');
      await api('/auth/register', { method: 'POST', body: JSON.stringify({ login, password, phone, email }) });
      setMsg('Регистрация успешна, можно войти');
      setLogin(''); setPassword(''); setPhone(''); setEmail('');
    } catch (e:any) {
      setErr(e?.message || 'Ошибка регистрации');
    }
  };

  return (
    <div className="max-w-md mx-auto py-10">
      <h1 className="text-xl font-semibold mb-4">Регистрация ученика</h1>
      {err && <div className="mb-3 px-3 py-2 rounded border border-rose-300 bg-rose-50 text-rose-800">{err}</div>}
      {msg && <div className="mb-3 px-3 py-2 rounded border border-green-300 bg-green-50 text-green-800">{msg}</div>}
      <form className="space-y-3" onSubmit={onSubmit}>
        <div>
          <label className="text-sm block mb-1">Логин</label>
          <input className="w-full rounded border px-3 py-2" value={login} onChange={e=>setLogin(e.target.value)} required />
        </div>
        <div>
          <label className="text-sm block mb-1">Пароль</label>
          <input type="password" className="w-full rounded border px-3 py-2" value={password} onChange={e=>setPassword(e.target.value)} required />
        </div>
        <div>
          <label className="text-sm block mb-1">Телефон</label>
          <input className="w-full rounded border px-3 py-2" value={phone} onChange={e=>setPhone(e.target.value)} required />
        </div>
        <div>
          <label className="text-sm block mb-1">Email</label>
          <input type="email" className="w-full rounded border px-3 py-2" value={email} onChange={e=>setEmail(e.target.value)} required />
        </div>
        <button className="px-4 py-2 rounded border bg-blue-600 text-white">Зарегистрироваться</button>
      </form>
      <div className="mt-4 text-sm">
        Уже есть аккаунт? <Link href="/login" className="text-blue-600 hover:underline">Войти</Link>
      </div>
    </div>
  );
}
