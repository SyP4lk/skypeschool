'use client';
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

type ToastItem = { id: number; type: 'success'|'error'|'info'; message: string };
type ToastCtx  = { toast: (v: { type: ToastItem['type']; message: string }) => void };

const Ctx = createContext<ToastCtx | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<ToastItem[]>([]);
  const toast = useCallback(({ type, message }: { type: ToastItem['type']; message: string }) => {
    const id = Date.now() + Math.random();
    setItems(a => [...a, { id, type, message }]);
    setTimeout(() => setItems(a => a.filter(x => x.id !== id)), 4000);
  }, []);
  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <Ctx.Provider value={value}>
      {children}
      {typeof document !== 'undefined' && createPortal(
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
          {items.map(i => (
            <div key={i.id} className="rounded-xl shadow px-4 py-3 min-w-[260px] bg-white border pointer-events-auto">
              <div className="text-sm font-semibold">
                {i.type === 'success' ? 'Готово' : i.type === 'error' ? 'Ошибка' : 'Сообщение'}
              </div>
              <div className="text-sm opacity-80">{i.message}</div>
            </div>
          ))}
        </div>,
        document.body
      )}
    </Ctx.Provider>
  );
};

export function useToast() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx.toast;
}

// Глобальный перехватчик fetch (с нормальными регекспами)
export function installFetchToasts(toast: (v:{type:'success'|'error'|'info'; message:string})=>void) {
  if (typeof window === 'undefined') return;
  const w = window as any;
  if (w.__fetchToastsInstalled) return;
  w.__fetchToastsInstalled = true;

  const HUMAN: Record<string,string> = {
    insufficient_funds: 'У ученика недостаточно средств.',
    too_late_to_cancel: 'Слишком поздно для отмены урока.',
    required_fields: 'Заполните все обязательные поля.',
    login_or_email_required: 'Укажите логин или email (одно из).',
    login_taken: 'Такой логин уже занят.',
    email_taken: 'Эта почта уже используется.',
  };

  const orig: any = w.fetch.bind(window);
  w.fetch = async (input: any, init?: any) => {
    const method = (init && typeof init === 'object' && 'method' in init)
      ? String((init as any).method || 'GET').toUpperCase() : 'GET';
    const url = (typeof input === 'string') ? input : (input && input.url) ? input.url : '';

    const res: Response = await orig(input, init);

    // Успехи
    try {
      if (res.ok) {
        if (method === 'POST' && /\/student\/me\/lessons\/[^/]+\/cancel$/.test(url)) {
          toast({ type: 'success', message: 'Урок отменён.' });
        }
        if (method === 'POST' && /\/teacher\/me\/lessons$/.test(url)) {
          toast({ type: 'success', message: 'Урок назначен.' });
        }
      }
    } catch {}

    // Ошибки
    try {
      const ct = res.headers.get('content-type') || '';
      if (!res.ok && ct.includes('application/json')) {
        const j: any = await res.clone().json();
        let msg = typeof j?.message === 'string' ? j.message
                : (Array.isArray(j?.message) ? j.message[0] : '');
        if (msg) toast({ type: 'error', message: HUMAN[msg] || 'Ошибка запроса' });
      }
    } catch {}

    return res;
  };
}
