'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const [login, setLogin] = useState('student@example.com');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    const api = process.env.NEXT_PUBLIC_API_URL!;
    try {
      const res = await fetch(`${api}/auth/register-student`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ login, password, firstName, lastName }),
      });
      if (!res.ok) throw new Error(await res.text());
      router.push('/student');
    } catch (e: any) {
      setErr(e.message ?? 'Ошибка регистрации');
    }
  };

  return (
    <main className="p-6 max-w-sm mx-auto">
      <h1 className="text-xl font-semibold mb-4">Регистрация ученика</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="block text-sm mb-1">Email/логин</label>
          <input value={login} onChange={e=>setLogin(e.target.value)} className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm mb-1">Пароль</label>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full border rounded px-3 py-2" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm mb-1">Имя</label>
            <input value={firstName} onChange={e=>setFirstName(e.target.value)} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm mb-1">Фамилия</label>
            <input value={lastName} onChange={e=>setLastName(e.target.value)} className="w-full border rounded px-3 py-2" />
          </div>
        </div>
        {err && <div className="text-sm text-red-600">{err}</div>}
        <button className="px-4 py-2 rounded bg-black text-white">Зарегистрироваться</button>
      </form>
    </main>
  );
}
