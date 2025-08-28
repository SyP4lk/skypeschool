'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

type TrialReqPayload = {
  name?: string;
  email?: string;
  phone?: string;
  message: string;
  subjectId?: string;
};

type LocalMsg = {
  id: string;
  role: 'user' | 'admin';
  text: string;
  createdAt: number;
};

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function SupportWidget() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState<string>('');
  const [contact, setContact] = useState<string>('');
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<LocalMsg[]>([]);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    try {
      const s = localStorage.getItem('supportChat');
      if (s) {
        const saved = JSON.parse(s);
        if (saved?.name) setName(saved.name);
        if (saved?.contact) setContact(saved.contact);
        if (Array.isArray(saved?.msgs)) setMsgs(saved.msgs);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('supportChat', JSON.stringify({ name, contact, msgs }));
    } catch {}
  }, [name, contact, msgs]);

  useEffect(() => {
    if (!open) return;
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [open, msgs.length]);

  const canSend = useMemo(() => text.trim().length > 0, [text]);

  const send = useCallback(async () => {
    if (!canSend || sending) return;
    setSending(true);
    setErr(null); setOk(null);

    const userMsg: LocalMsg = { id: uid(), role: 'user', text: text.trim(), createdAt: Date.now() };
    setMsgs((m) => [...m, userMsg]);
    setText('');

    try {
      const base = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api').replace(/\/+$/, '');
      const payload: TrialReqPayload = { message: userMsg.text };
      if (name) payload.name = name.trim();
      if (contact) {
        if (contact.includes('@')) payload.email = contact.trim();
        else payload.phone = contact.trim();
      }
      const res = await fetch(`${base}/trial-requests`, {
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
      setOk('Сообщение отправлено. Мы свяжемся с вами в ближайшее время.');
    } catch (e: any) {
      setErr(e?.message || 'Не удалось отправить. Попробуйте позже.');
    } finally {
      setSending(false);
    }
  }, [canSend, sending, text, name, contact]);

  function toggle() { setOpen((v) => !v); }

  const transition = prefersReduced ? { duration: 0 } : { type: 'spring', bounce: 0.28, duration: 0.5 };

  return (
    <div className="fixed right-4 bottom-4 z-50">
      <AnimatePresence initial={false}>
        {!open && (
          <motion.button
            key="bubble"
            layoutId="support-widget"
            transition={transition}
            onClick={toggle}
            aria-label="Открыть поддержку"
            aria-expanded={false}
            className="h-14 w-14 rounded-full bg-black text-white shadow-lg flex items-center justify-center text-2xl"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.span
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={transition}
            >
              ?
            </motion.span>
          </motion.button>
        )}

        {open && (
          <motion.div
            key="panel"
            role="dialog"
            aria-label="Чат поддержки"
            aria-modal="false"
            layoutId="support-widget"
            transition={transition}
            className="w-[min(360px,calc(100vw-2rem))] max-h-[70vh] bg-white border rounded-2xl shadow-xl flex flex-col overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: prefersReduced ? 0 : 0 }}
          >
            <motion.div className="px-4 py-3 border-b flex items-center justify-between bg-white" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: prefersReduced ? 0 : 0.2, delay: prefersReduced ? 0 : 0.05 }}>
              <div className="font-medium">Поддержка</div>
              <button className="text-sm text-gray-500" onClick={toggle} aria-label="Закрыть поддержку">Закрыть</button>
            </motion.div>

            <motion.div className="px-4 py-3 grid gap-3 overflow-y-auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: prefersReduced ? 0 : 0.2, delay: prefersReduced ? 0 : 0.1 }}>
              {msgs.map((m) => (
                <div key={m.id} className={m.role === 'user' ? 'text-right' : 'text-left'}>
                  <div className={m.role === 'user' ? 'inline-block px-3 py-2 rounded-2xl bg-black text-white' : 'inline-block px-3 py-2 rounded-2xl bg-gray-100'}>
                    {m.text}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </motion.div>

            <motion.div className="px-4 pb-3 bg-white" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: prefersReduced ? 0 : 0.2, delay: prefersReduced ? 0 : 0.15 }}>
              <div className="grid gap-2 mb-2">
                <input className="w-full border rounded px-3 py-2" placeholder="Как к вам обращаться (необязательно)" value={name} onChange={(e) => setName(e.target.value)} />
                <input className="w-full border rounded px-3 py-2" placeholder="Телефон или e-mail (для ответа)" value={contact} onChange={(e) => setContact(e.target.value)} />
              </div>

              <div className="flex items-center gap-2">
                <input ref={inputRef} className="flex-1 border rounded px-3 py-2" placeholder="Напишите сообщение…" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} />
                <button onClick={send} disabled={!canSend || sending} className="px-3 py-2 rounded bg-black text-white disabled:opacity-60">Отправить</button>
              </div>

              {ok && <div className="text-xs text-green-700 mt-2">{ok}</div>}
              {err && <div className="text-xs text-red-600 mt-2">{err}</div>}

              <div className="text-[11px] text-gray-500 mt-2">*Сейчас сообщения доставляются менеджеру. Ответ придёт на указанный контакт.</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
