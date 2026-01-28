'use client';

export type NotifyPayload = {
  type?: 'success' | 'error';
  text: string;
  timeoutMs?: number;
};

// Человеческие тексты по кодам с бэка
export function toHuman(codeOrText: string): string {
  const s = String(codeOrText || '').trim();

  // известные коды
  if (s === 'insufficient_funds') return 'У ученика недостаточно средств.';
  if (s === 'too_late_to_cancel') return 'Отменить можно не позднее чем за 8 часов до начала';

  // если пришёл уже нормальный текст — отдадим его
  if (s.length > 0 && !/^[a-z_]+$/i.test(s)) return s;

  // дефолтно
  return 'Произошла ошибка. Попробуйте ещё раз.';
}

// Лёгкая шина событий без контекстов/провайдеров
export function notify(p: NotifyPayload | string, type: 'success' | 'error' = 'success') {
  const payload: NotifyPayload = typeof p === 'string' ? { text: p, type } : { type: 'success', ...p };
  if (payload.text) {
    window.dispatchEvent(new CustomEvent('app:notify', { detail: payload }));
  }
}
