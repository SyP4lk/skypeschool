'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import type { Transition } from 'framer-motion';

type LocalMsg = { id: string; role: 'user' | 'admin'; text: string; createdAt: number };

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

function ensureClientKey() {
  try {
    const s = localStorage.getItem('supportClientKey');
    if (s) return s;
    const k = uid();
    localStorage.setItem('supportClientKey', k);
    return k;
  } catch {
    return uid();
  }
}

export default function SupportWidget() {
  const [open, setOpen] = useState(false);

  // профиль и локальная лента
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [msgs, setMsgs] = useState<LocalMsg[]>([]);

  // отправка/ошибки
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  // связь с серверной лентой
  const [clientKey, setClientKey] = useState<string>('');
  const [threadId, setThreadId] = useState<string>(''); // = clientKey

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const prefersReduced = useReducedMotion();

  // Инициализация состояния из localStorage + первичная загрузка истории
  useEffect(() => {
    (async () => {
      try {
        const k = ensureClientKey();
        setClientKey(k);
        setThreadId(k);

        const saved = JSON.parse(localStorage.getItem('supportChat') || '{}');
        setName(saved?.name || '');
        setContact(saved?.contact || '');

        const r = await fetch(
          `/api/support/threads/${encodeURIComponent(k)}/messages?clientKey=${encodeURIComponent(k)}`,
          { cache: 'no-store' }
        );
        const j = await r.json().catch(() => ({}));
        const items: any[] = Array.isArray(j?.items) ? j.items : [];
        const mapped: LocalMsg[] = items.map((m) => ({
          id: String(m.id),
          role: m.role,
          text: m.message,
          createdAt: +new Date(m.createdAt),
        }));
        setMsgs(mapped);
      } catch {
        /* noop */
      }
    })();
  }, []);

  // сохраняем профиль и сообщения локально (для UX)
  useEffect(() => {
    try {
      localStorage.setItem('supportChat', JSON.stringify({ name, contact, msgs }));
    } catch {
      /* noop */
    }
  }, [name, contact, msgs]);

  // автофокус и прокрутка вниз при открытии/новых сообщениях
  useEffect(() => {
    if (!open) return;
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [open, msgs.length]);

  // ПОЛЛИНГ: каждые 5с подтягиваем всю ленту (без after) и делаем дедуп по id
  useEffect(() => {
    if (!threadId) return;
    const t = setInterval(async () => {
      try {
        const r = await fetch(
          `/api/support/threads/${encodeURIComponent(threadId)}/messages?clientKey=${encodeURIComponent(clientKey)}`,
          { cache: 'no-store' }
        );
        const j = await r.json().catch(() => ({}));
        const items: any[] = Array.isArray(j?.items) ? j.items : [];
        if (!items.length) return;

        setMsgs((prev) => {
          const seen = new Set(prev.map((m) => m.id));
          const next = items
            .map((m) => ({
              id: String(m.id),
              role: m.role,
              text: m.message,
              createdAt: +new Date(m.createdAt),
            }))
            .filter((m) => !seen.has(m.id));
          return next.length ? [...prev, ...next] : prev;
        });
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 40);
      } catch {
        /* silent */
      }
    }, 5000);
    return () => clearInterval(t);
  }, [threadId, clientKey]);

  const canSend = useMemo(() => text.trim().length > 0, [text]);
  const toggle = () => setOpen((v) => !v);

  // Отправка сообщения (оптимистично + полный рефетч)
  const send = useCallback(async () => {
    if (!canSend || sending) return;
    setSending(true);
    setErr(null);
    setOk(null);

    const trimmed = text.trim();
    const optimistic: LocalMsg = {
      id: uid(),
      role: 'user',
      text: trimmed,
      createdAt: Date.now(),
    };

    // 1) мгновенный показ
    setMsgs((m) => [...m, optimistic]);
    setText('');

    // 2) формируем payload
    const payload: any = {
      message: trimmed,
      name: name.trim() || undefined,
      clientKey: clientKey || ensureClientKey(),
    };
    if (contact.trim()) {
      if (contact.includes('@')) payload.email = contact.trim();
      else payload.phone = contact.trim();
    }

    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const txt = await res.text();
      let data: any = null;
      try {
        data = txt ? JSON.parse(txt) : null;
      } catch {
        data = { raw: txt };
      }

      if (!res.ok) throw new Error(data?.message || txt || `HTTP ${res.status}`);

      if (data?.clientKey) {
        setClientKey(data.clientKey);
        try {
          localStorage.setItem('supportClientKey', data.clientKey);
        } catch {}
      }
      if (data?.threadId) setThreadId(data.threadId);

      setOk('Сообщение отправлено.');

      // 3) СРАЗУ подтягиваем полную ленту (без after)
      const k = String(data?.threadId || threadId || payload.clientKey);
      const r2 = await fetch(
        `/api/support/threads/${encodeURIComponent(k)}/messages?clientKey=${encodeURIComponent(
          String(data?.clientKey || clientKey || payload.clientKey)
        )}`,
        { cache: 'no-store' }
      );
      const j2 = await r2.json().catch(() => ({}));
      const items2: any[] = Array.isArray(j2?.items) ? j2.items : [];
      const mapped2: LocalMsg[] = items2.map((m) => ({
        id: String(m.id),
        role: m.role,
        text: m.message,
        createdAt: +new Date(m.createdAt),
      }));
      setMsgs(mapped2);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 40);
    } catch (e: any) {
      // откат оптимизма при ошибке
      setMsgs((prev) => prev.filter((m) => m.id !== optimistic.id));
      setErr(e?.message || 'Не удалось отправить. Попробуйте позже.');
    } finally {
      setSending(false);
    }
  }, [canSend, sending, text, name, contact, clientKey, threadId]);

  const springTransition: Transition = { type: 'spring', bounce: 0.28, duration: 0.5 };
  const instantTransition: Transition = { duration: 0 };
  const transition: Transition = prefersReduced ? instantTransition : springTransition;

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
            className="h-14 w-14 rounded-full shadow-lg flex items-center justify-center text-2xl"
            style={{ backgroundColor: 'var(--colour-primary)', color: '#fff' }}
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
            exit={{ opacity: 0 }}
          >
            <div className="px-4 py-3 border-b flex items-center justify-between" style={{ background: 'var(--colour-bg)' }}>
              <div className="font-medium" style={{ color: 'var(--colour-text)' }}>Поддержка</div>
              <button className="text-sm" style={{ color: 'var(--colour-secondary)' }} onClick={toggle}>
                Закрыть
              </button>
            </div>

            <div className="px-4 py-3 grid gap-3 overflow-y-auto">
              {msgs.map((m) => (
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
                <input
                  className="w-full border rounded px-3 py-2"
                  placeholder="Как к вам обращаться (необязательно)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <input
                  className="w-full border rounded px-3 py-2"
                  placeholder="Телефон или e-mail (для ответа)"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  className="flex-1 border rounded px-3 py-2"
                  placeholder="Напишите сообщение…"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      void send();
                    }
                  }}
                />
                <button
                  onClick={() => void send()}
                  disabled={!canSend || sending}
                  className="px-3 py-2 rounded text-white disabled:opacity-60"
                  style={{ backgroundColor: 'var(--colour-primary)' }}
                >
                  Отправить
                </button>
              </div>

              {ok && <div className="text-xs" style={{ color: 'var(--colour-secondary)' }}>{ok}</div>}
              {err && <div className="text-xs text-red-600">{err}</div>}

              <div className="text-[11px] text-gray-500 mt-2">
                *Сейчас сообщения попадают менеджеру. Ответ придёт на указанный контакт.
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
