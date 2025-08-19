'use client';

import { useEffect, useRef } from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function TrialRequestModal({ open, onClose }: Props) {
  const firstInputRef = useRef<HTMLInputElement | null>(null);

  // Закрыть по ESC + фокус на первый инпут при открытии + запрет скролла фона
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    setTimeout(() => firstInputRef.current?.focus(), 0);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    + (async () => {
   const data = Object.fromEntries(new FormData(e.currentTarget).entries());
   const api = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/,'');
   const res = await fetch(`${api}/trial-requests`, {
     method: 'POST',
     headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
     credentials: 'include',
     body: JSON.stringify(data),
   });
   if (!res.ok) { alert(await res.text().catch(()=> 'Ошибка отправки')); return; }
   alert('Заявка отправлена! Мы свяжемся с вами.');
   onClose();
 })().catch(()=>alert('Ошибка сети'));
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/40 p-4 sm:p-6"
      aria-modal="true"
      role="dialog"
      aria-labelledby="trial-title"
      onMouseDown={onClose} // клик по фону
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()} // клики внутри не закрывают
      >
        {/* Крестик */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Закрыть"
          className="absolute right-3 top-3 h-8 w-8 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-700"
        >
          ×
        </button>

        <div className="p-6 sm:p-7">
          <h3 id="trial-title" className="mb-5 text-center text-2xl font-extrabold">
            Бесплатный пробный урок
          </h3>

          <form className="space-y-3" onSubmit={handleSubmit}>
            <Input label="Имя*" name="name" required inputRef={firstInputRef} />
            <Input label="E-mail*" name="email" type="email" required />
            <Input label="Телефон*" name="phone" required />
            <Input label="Skype*" name="skype" required />
            <Input label="WhatsApp" name="whatsapp" />
            <Input label="Viber" name="viber" />

            <button
              type="submit"
              className="mt-3 h-12 w-full rounded-xl bg-gradient-to-r from-orange-400 to-amber-500 font-bold text-white shadow-md hover:from-orange-500 hover:to-amber-600"
            >
              Отправить заявку
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-slate-500">
            Заполняя данную форму и нажимая на кнопку «Отправить» вы соглашаетесь с{' '}
            <a className="text-sky-600 hover:underline" href="/policy">политикой обработки персональных данных</a>{' '}
            и{' '}
            <a className="text-sky-600 hover:underline" href="/terms">пользовательским соглашением</a>.
          </p>
        </div>
      </div>
    </div>
  );
}

function Input({
  label,
  name,
  type = 'text',
  required,
  inputRef,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  inputRef?: React.RefObject<HTMLInputElement>;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <input
        ref={inputRef}
        name={name}
        type={type}
        required={required}
        className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
      />
    </label>
  );
}
