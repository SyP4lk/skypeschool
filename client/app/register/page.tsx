'use client';
import { useState } from 'react';

const API = (process.env.NEXT_PUBLIC_API_URL || '/api').replace(/\/$/, '');

export default function RegisterPage() {
  const [firstName, setFirst] = useState('');
  const [lastName, setLast] = useState('');
  const [login, setLogin] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [messenger, setMessenger] = useState('telegram');
  const [messengerContact, setMessengerContact] = useState('');
  const [err, setErr] = useState<string|null>(null);
  const [ok, setOk] = useState<string|null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setOk(null); setLoading(true);
    try {
      const body = new URLSearchParams();
      if (firstName) body.set('firstName', firstName);
      if (lastName) body.set('lastName', lastName);
      if (login) body.set('login', login);
      if (email) body.set('email', email);
      if (password) body.set('password', password);
      if (phone) body.set('phone', phone);
      if (messenger) body.set('messenger', messenger);
      if (messengerContact) body.set('messengerContact', messengerContact);

      const res = await fetch(`${API}/auth/register`, {
        method: 'POST',
        body,
        credentials: 'include',
        cache: 'no-store',
      });
      const text = await res.text().catch(()=>'');
      if (!res.ok) {
        let msg = '';
        try { msg = JSON.parse(text)?.message || res.statusText; } catch { msg = text || res.statusText; }
        throw new Error(msg);
      }
      setOk('Регистрация успешна. Вы вошли в систему.');
    } catch (e:any) {
      setErr(e?.message || 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto max-w-lg py-6">
      <h1 className="text-xl font-semibold mb-4">Регистрация</h1>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-2">
          <input required placeholder="Имя" className="border rounded p-2" value={firstName} onChange={e=>setFirst(e.target.value)} />
          <input required placeholder="Фамилия" className="border rounded p-2" value={lastName} onChange={e=>setLast(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input placeholder="Логин" className="border rounded p-2" value={login} onChange={e=>setLogin(e.target.value)} />
          <input placeholder="Email" type="email" className="border rounded p-2" value={email} onChange={e=>setEmail(e.target.value)} />
        </div>
        <input required type="password" placeholder="Пароль" className="border rounded p-2" value={password} onChange={e=>setPassword(e.target.value)} />
        <input required placeholder="Телефон" className="border rounded p-2" value={phone} onChange={e=>setPhone(e.target.value)} />
        <div className="grid grid-cols-2 gap-2">
          <select className="border rounded p-2" value={messenger} onChange={e=>setMessenger(e.target.value)}>
            <option value="telegram">Telegram</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="viber">Viber</option>
          </select>
          <input placeholder="Контакт (ник/номер)" className="border rounded p-2" value={messengerContact} onChange={e=>setMessengerContact(e.target.value)} />
        </div>
        <button className="px-4 py-2 rounded border bg-blue-600 text-white disabled:opacity-60" disabled={loading}>
          {loading ? 'Отправляем…' : 'Зарегистрироваться'}
        </button>
      </form>
      {ok && <div className="mt-4 text-sm text-green-700">{ok}</div>}
      {err && <div className="mt-2 text-sm text-red-600">{err}</div>}
    </div>
  );
}
