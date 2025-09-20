'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

type ToastItem = { id: number; type: 'success'|'error'|'info'; title?: string; message: string; };
type ToastCtx = { toast: (t: Omit<ToastItem, 'id'>) => void; };

const Ctx = createContext<ToastCtx | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<ToastItem[]>([]);

  const toast = useCallback((t: Omit<ToastItem, 'id'>) => {
    const id = Date.now() + Math.random();
    setItems(prev => [...prev, { id, ...t }]);
    setTimeout(() => setItems(prev => prev.filter(x => x.id !== id)), 4000);
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <Ctx.Provider value={value}>
      {children}
      {typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
            {items.map(i => (
              <div key={i.id}
                   className="rounded-2xl shadow px-4 py-3 min-w-[260px] bg-white/90 backdrop-blur border">
                <div className="text-sm font-medium">
                  {i.title || (i.type === 'success' ? 'Готово' : i.type === 'error' ? 'Ошибка' : 'Сообщение')}
                </div>
                <div className="text-sm opacity-80">{i.message}</div>
              </div>
            ))}
          </div>,
          document.body,
        )}
    </Ctx.Provider>
  );
};

export function useToast() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx.toast;
}
