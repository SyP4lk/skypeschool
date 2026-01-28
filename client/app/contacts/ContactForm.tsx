'use client';

import { useState } from 'react';

export default function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const API = '/api';

  async function post(url: string, body: any) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    });
    const raw = await res.text();
    if (!res.ok) {
      try { const j = JSON.parse(raw); throw new Error(j?.message || raw || res.statusText); }
      catch { throw new Error(raw || res.statusText); }
    }
  }

  async function submit() {
    if (sending) return;
    setSending(true); setOk(null); setErr(null);
    const payload: any = {
      name: name.trim() || undefined,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      message: message.trim() || undefined,
    };
    try {
      // основной эндпоинт
      await post(`${API}/trials`, payload);
      setOk('Заявка отправлена!');
      setName(''); setEmail(''); setPhone(''); setMessage('');
    } catch (e1: any) {
      // fallback на старый маршрут, если есть
      try {
        await post(`${API}/trial-requests`, payload);
        setOk('Заявка отправлена!');
        setName(''); setEmail(''); setPhone(''); setMessage('');
      } catch (e2: any) {
        setErr(e2?.message || e1?.message || 'Не удалось отправить');
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="text-lg font-semibold mb-3" style={{ color: 'var(--colour-text)' }}>
        Свяжитесь с нами
      </div>

      <div className="grid gap-2">
        <input
          className="border rounded px-3 py-2"
          placeholder="Имя"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="border rounded px-3 py-2"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="border rounded px-3 py-2"
          placeholder="Телефон"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <textarea
          className="border rounded px-3 py-2"
          placeholder="Сообщение (необязательно)"
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        <div className="flex items-center gap-3 pt-1">
          <button
            className="px-4 py-2 rounded text-white disabled:opacity-60"
            style={{ backgroundColor: 'var(--colour-primary)' }}
            disabled={sending}
            onClick={submit}
          >
            Отправить заявку
          </button>
          {ok && <span className="text-green-700 text-sm">{ok}</span>}
          {err && <span className="text-red-600 text-sm">{err}</span>}
        </div>
      </div>
    </div>
  );
}
