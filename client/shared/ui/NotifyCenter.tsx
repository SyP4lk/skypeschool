'use client';
import { useEffect, useRef, useState } from 'react';
import type { NotifyPayload } from './notify';

export function NotifyCenter() {
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: 'success'|'error' } | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    function onEvt(e: Event) {
      const detail = (e as CustomEvent<NotifyPayload>).detail;
      const text = (detail?.text || '').toString();
      const type = detail?.type === 'error' ? 'error' : 'success';
      const timeoutMs = Math.max(1500, Math.min(8000, detail?.timeoutMs ?? (type === 'error' ? 5000 : 3000)));

      setMsg({ text, type });
      setOpen(true);

      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setOpen(false), timeoutMs);
    }
    window.addEventListener('app:notify', onEvt as any);
    return () => {
      window.removeEventListener('app:notify', onEvt as any);
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  if (!msg) return null;

  return (
    <div
      aria-live="polite"
      className={`fixed right-4 bottom-4 z-50 max-w-sm transition-all duration-200
        ${open ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'}`}
    >
      <div className={`rounded-xl border px-4 py-3 shadow-lg bg-white
        ${msg.type === 'success' ? 'border-green-300' : 'border-red-300'}`}>
        <div className={`text-sm ${msg.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
          {msg.text}
        </div>
      </div>
    </div>
  );
}
