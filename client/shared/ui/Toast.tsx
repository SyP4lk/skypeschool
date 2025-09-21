'use client';
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

type ToastItem = { id: number; type: 'success'|'error'|'info'; message: string };
type ToastFn = (v: { type: ToastItem['type']; message: string }) => void;
type ToastCtx  = { toast: ToastFn };

const Ctx = createContext<ToastCtx | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<ToastItem[]>([]);
  const toast = useCallback<ToastFn>(({ type, message }) => {
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

/**
 * Безопасный хук: если провайдер не подключён, возвращаем no-op функцию.
 * Это исключит «Invalid hook call»/крэши при временно отключённом провайдере.
 */
export function useToast(): ToastFn {
  const ctx = useContext(Ctx);
  if (!ctx) {
    return () => { /* no-op */ };
  }
  return ctx.toast;
}
