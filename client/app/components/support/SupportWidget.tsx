'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import type { Transition } from 'framer-motion';

type TrialReqPayload = { name?: string; email?: string; phone?: string; message: string; subjectId?: string };
type LocalMsg = { id: string; role: 'user' | 'admin'; text: string; createdAt: number };
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

export default function SupportWidget() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(''); const [contact, setContact] = useState('');
  const [text, setText] = useState(''); const [sending, setSending] = useState(false);
  const [err, setErr] = useState<string | null>(null); const [ok, setOk] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<LocalMsg[]>([]);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const prefersReduced = useReducedMotion();

  useEffect(() => { try { const s = localStorage.getItem('supportChat'); if (s) {
    const saved = JSON.parse(s); setName(saved?.name || ''); setContact(saved?.contact || '');
    if (Array.isArray(saved?.msgs)) setMsgs(saved.msgs);
  }} catch {} }, []);
  useEffect(() => { try { localStorage.setItem('supportChat', JSON.stringify({ name, contact, msgs })); } catch {} }, [name, contact, msgs]);

  useEffect(() => {
    if (!open) return;
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [open, msgs.length]);

  const canSend = useMemo(() => text.trim().length > 0, [text]);
  const toggle = () => setOpen(v => !v);

const send = useCallback(async () => {
  if (!canSend || sending) return;
  setSending(true); setErr(null); setOk(null);

  const userMsg: LocalMsg = { id: uid(), role: 'user', text: text.trim(), createdAt: Date.now() };
  setMsgs(m => [...m, userMsg]); setText('');

  const base = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api').replace(/\/+$/, '');
  const payload: any = { message: userMsg.text, name: name.trim() || undefined };
  if (contact.trim()) contact.includes('@') ? (payload.email = contact.trim()) : (payload.phone = contact.trim());

  // Пытаемся в поддержку -> затем фолбэк в старые ручки
  const endpoints = [
    `${base}/support`,
    `${base}/support-requests`, // если вдруг так назвали
    `${base}/trials`,
    `${base}/trial-requests`,
  ];

  async function trySend(url: string) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    const raw = await res.text();
    if (!res.ok) {
      try { const j = JSON.parse(raw); throw new Error(j?.message || raw || res.statusText); }
      catch { throw new Error(raw || res.statusText); }
    }
  }

  let lastErr: any = null;
  for (const url of endpoints) {
    try { await trySend(url); lastErr = null; break; }
    catch (e) { lastErr = e; }
  }
  if (lastErr) setErr((lastErr as any)?.message || 'Не удалось отправить. Попробуйте позже.');
  else setOk('Сообщение отправлено. Мы свяжемся с вами.');

  setSending(false);
}, [canSend, sending, text, name, contact]);


  const springTransition: Transition = { type: 'spring', bounce: 0.28, duration: 0.5 };
  const instantTransition: Transition = { duration: 0 };
  const transition: Transition = prefersReduced ? instantTransition : springTransition;

  return (
    <div className="fixed right-4 bottom-4 z-50">
      <AnimatePresence initial={false}>
        {!open && (
          <motion.button
            key="bubble" layoutId="support-widget" transition={transition} onClick={toggle}
            aria-label="Открыть поддержку" aria-expanded={false}
            className="h-14 w-14 rounded-full shadow-lg flex items-center justify-center text-2xl"
            style={{ backgroundColor: 'var(--colour-primary)', color: '#fff' }}
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
          >
            <motion.span initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} transition={transition}>?</motion.span>
          </motion.button>
        )}

        {open && (
          <motion.div
            key="panel" role="dialog" aria-label="Чат поддержки" aria-modal="false"
            layoutId="support-widget" transition={transition}
            className="w-[min(360px,calc(100vw-2rem))] max-h-[70vh] bg-white border rounded-2xl shadow-xl flex flex-col overflow-hidden"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <div className="px-4 py-3 border-b flex items-center justify-between" style={{ background: 'var(--colour-bg)' }}>
              <div className="font-medium" style={{ color: 'var(--colour-text)' }}>Поддержка</div>
              <button className="text-sm" style={{ color: 'var(--colour-secondary)' }} onClick={toggle}>Закрыть</button>
            </div>

            <div className="px-4 py-3 grid gap-3 overflow-y-auto">
              {msgs.map(m => (
                <div key={m.id} className={m.role === 'user' ? 'text-right' : 'text-left'}>
                  <div
                    className="inline-block px-3 py-2 rounded-2xl"
                    style={
                      m.role === 'user'
                        ? { backgroundColor: 'var(--colour-secondary)', color: '#fff' }
                        : { backgroundColor: '#f1f3f5', color: 'var(--colour-text)' }
                    }
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            <div className="px-4 pb-3 bg-white">
              <div className="grid gap-2 mb-2">
                <input className="w-full border rounded px-3 py-2" placeholder="Как к вам обращаться (необязательно)" value={name} onChange={(e) => setName(e.target.value)} />
                <input className="w-full border rounded px-3 py-2" placeholder="Телефон или e-mail (для ответа)" value={contact} onChange={(e) => setContact(e.target.value)} />
              </div>

              <div className="flex items-center gap-2">
                <input
                  ref={inputRef} className="flex-1 border rounded px-3 py-2"
                  placeholder="Напишите сообщение…" value={text} onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                />
                <button
                  onClick={send} disabled={!canSend || sending}
                  className="px-3 py-2 rounded text-white disabled:opacity-60"
                  style={{ backgroundColor: 'var(--colour-primary)' }}
                >
                  Отправить
                </button>
              </div>

              {ok && <div className="text-xs" style={{ color: 'var(--colour-secondary)' }}>{ok}</div>}
              {err && <div className="text-xs text-red-600">{err}</div>}

              <div className="text-[11px] text-gray-500 mt-2">*Сейчас сообщения попадают менеджеру. Ответ придёт на указанный контакт.</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
