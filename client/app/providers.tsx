'use client';

import React from 'react';

/**
 * Временный провайдер-болванка: НИЧЕГО не делает, просто рендерит children.
 * Это исключит любые побочные эффекты и позволит загрузиться ЛК.
 * Тосты подключим повторно после стабилизации страницы.
 */
export default function Providers({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

// Если где-то ожидается именованный экспорт Providers — оставляем совместимость
export { default as Providers } from './providers';
