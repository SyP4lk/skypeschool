
'use client';
import { useState } from 'react';

const API = '/api';

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
  const [loading, setLoading] = useState(false);

  function valid() {
    return firstName && lastName && password && phone && messenger && messengerContact && (login || email);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!valid()) { setErr('Заполните все поля. Укажите логин или email.'); return; }
    setLoading(true);
    const form = new URLSearchParams();
    if (login) form.set('login', login);
    if (email) form.set('email', email);
    form.set('password', password);
    form.set('firstName', firstName);
    form.set('lastName', lastName);
    form.set('phone', phone.replace(/\D+/g, ''));
    form.set('messenger', `${messenger}:${messengerContact}`);
    try {
      const r = await fetch(`${API}/auth/register`, { method: 'POST', body: form, credentials: 'include' });
      if (!r.ok) throw new Error('register_failed');
      location.href = '/lk/student';
    } catch {
      setErr('Регистрация не удалась. Попробуйте позже.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto p-6">
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
            <option value="vk">VK</option>
          </select>
          <input required placeholder="Контакт в мессенджере (@nick / +7900...)" className="border rounded p-2"
                 value={messengerContact} onChange={e=>setMessengerContact(e.target.value)} />
        </div>
        <button disabled={loading} className="rounded bg-black text-white py-2">
          {loading ? 'Создаём…' : 'Зарегистрироваться'}
        </button>
        {err && <div className="text-sm text-red-600">{err}</div>}
      </form>
    </div>
  );
}
