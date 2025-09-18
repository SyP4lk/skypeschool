'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL!;

type Messenger = 'telegram' | 'whatsapp' | 'viber' | 'skype' | 'other';

const MESSENGERS: { key: Messenger; label: string; emoji: string; placeholder: string }[] = [
  { key: 'telegram', label: 'Telegram', emoji: '✈️', placeholder: '@nickname' },
  { key: 'whatsapp', label: 'WhatsApp', emoji: '💬', placeholder: '+7 900 000-00-00' },
  { key: 'viber', label: 'Viber', emoji: '📱', placeholder: '+7 900 000-00-00' },
  { key: 'skype', label: 'Skype', emoji: '📞', placeholder: 'live:login' },
  { key: 'other', label: 'Другое', emoji: '🔗', placeholder: 'контакт' },
];

export default function RegisterPage() {
  const router = useRouter();
  const [login, setLogin] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [messenger, setMessenger] = useState<Messenger>('telegram');
  const [messengerValue, setMessengerValue] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = useMemo(() => {
    const hasIdent = (login.trim() !== '') || (email.trim() !== '');
    return hasIdent && password.trim() !== '' && firstName.trim() !== '' && lastName.trim() !== '' && messengerValue.trim() !== '';
  }, [login, email, password, firstName, lastName, messengerValue]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || sending) return;
    setSending(true);
    setError(null);
    try {
      const body = new URLSearchParams();
      if (login) body.set('login', login);
      if (email) body.set('email', email);
      body.set('password', password);
      body.set('firstName', firstName);
      body.set('lastName', lastName);
      body.set('messengerType', messenger);
      body.set('messenger', messengerValue);

      const resp = await fetch(`${API}/auth/register`, {
        method: 'POST',
        credentials: 'include',
        body, // application/x-www-form-urlencoded — без preflight
      });

      if (resp.ok) {
        const me = await fetch(`${API}/auth/me`, { credentials: 'include' });
        if (me.ok) {
          const u = await me.json();
          if (u.role === 'admin') router.replace('/admin');
          else if (u.role === 'teacher') router.replace('/lk/teacher');
          else router.replace('/lk/student');
          return;
        }
        router.replace('/login');
      } else {
        const text = await resp.text();
        setError(text || 'Ошибка регистрации');
      }
    } catch (e: any) {
      setError(e?.message || 'Ошибка сети');
    } finally {
      setSending(false);
    }
  };

  const m = MESSENGERS.find(x => x.key === messenger)!;

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Регистрация</h1>
      {error && <div className="mb-4 bg-red-50 text-red-700 border border-red-200 rounded p-3">{error}</div>}

      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1">Логин <span className="text-red-600">*</span></label>
            <input value={login} onChange={e => setLogin(e.target.value)} className="border p-2 w-full rounded" placeholder="user123" />
            <p className="text-xs text-gray-500 mt-1">Заполните логин или E-mail (можно оба)</p>
          </div>
          <div>
            <label className="block mb-1">E-mail <span className="text-red-600">*</span></label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="border p-2 w-full rounded" placeholder="you@example.com" />
          </div>
        </div>

        <div>
          <label className="block mb-1">Пароль <span className="text-red-600">*</span></label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="border p-2 w-full rounded" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1">Имя <span className="text-red-600">*</span></label>
            <input value={firstName} onChange={e => setFirstName(e.target.value)} className="border p-2 w-full rounded" />
          </div>
          <div>
            <label className="block mb-1">Фамилия <span className="text-red-600">*</span></label>
            <input value={lastName} onChange={e => setLastName(e.target.value)} className="border p-2 w-full rounded" />
          </div>
        </div>

        <div>
          <label className="block mb-1">Мессенджер для связи <span className="text-red-600">*</span></label>
          <div className="flex items-stretch rounded-xl border border-black/20 overflow-hidden">
            <div className="px-3 py-2 bg-gray-50 min-w-[160px] flex items-center gap-2">
              <select
                value={messenger}
                onChange={e => setMessenger(e.target.value as Messenger)}
                className="bg-transparent outline-none"
                aria-label="Выбор мессенджера"
              >
                {MESSENGERS.map(x => (
                  <option key={x.key} value={x.key}>{x.emoji} {x.label}</option>
                ))}
              </select>
            </div>
            <input
              value={messengerValue}
              onChange={e => setMessengerValue(e.target.value)}
              placeholder={m.placeholder}
              className="flex-1 px-3 py-2 outline-none"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">Укажи телефон/логин в выбранном мессенджере</p>
        </div>

        <button
          type="submit"
          disabled={!valid || sending}
          className={`px-4 py-2 rounded text-white ${valid && !sending ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400'}`}
        >
          Зарегистрироваться
        </button>
      </form>
    </div>
  );
}
