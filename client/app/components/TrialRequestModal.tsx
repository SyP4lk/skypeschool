'use client';
import { useState } from 'react';

export default function TrialRequestModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  if (!open) return null;

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
      await post(`${API}/trials`, payload);
      setOk('Заявка отправлена!');
      setName(''); setEmail(''); setPhone(''); setMessage('');
    } catch (e1: any) {
      try { await post(`${API}/trial-requests`, payload); setOk('Заявка отправлена!'); }
      catch (e2: any) { setErr(e2?.message || e1?.message || 'Не удалось отправить'); }
    } finally { setSending(false); }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40">
      <div className="w-[min(520px,calc(100vw-2rem))] rounded-2xl bg-white p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-lg font-semibold" style={{ color: 'var(--colour-text)' }}>Пробный урок</div>
          <button className="text-sm" style={{ color: 'var(--colour-secondary)' }} onClick={onClose}>
            Закрыть
          </button>
        </div>

        <div className="grid gap-2">
          <input className="border rounded px-3 py-2" placeholder="Имя" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="border rounded px-3 py-2" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="border rounded px-3 py-2" placeholder="Телефон" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <textarea className="border rounded px-3 py-2" placeholder="Сообщение (необязательно)" rows={3} value={message} onChange={(e) => setMessage(e.target.value)} />
          <div className="flex items-center gap-3">
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
    </div>
  );
}
