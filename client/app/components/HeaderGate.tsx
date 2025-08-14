'use client';

import { usePathname } from 'next/navigation';
import HeaderHome from './Header';      // текущая шапка (как есть) — только для /
import HeaderAlt from './HeaderAlt';     // альтернативная шапка — для остальных публичных страниц

/** Показывает шапку на публичных страницах:
 * - На главной '/' — HeaderHome (оригинальная)
 * - На остальных публичных — HeaderAlt (альтернативная)
 * Прячет на: /login, /admin*, /student*, ровно /teacher (кабинет преподавателя)
 * (но на /teacher/[id] — шапка показывается)
 */
export default function HeaderGate() {
  const pathname = usePathname() || '/';

  // Без шапки:
  if (
    pathname === '/login' ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/student') ||
    pathname === '/teacher' // важно: именно кабинет, не публичная страница /teacher/[id]
  ) {
    return null;
  }

  // Главная — старая шапка 1-в-1
  if (pathname === '/') return <HeaderHome />;

  // Все остальные публичные — альтернативная шапка
  return <HeaderAlt />;
}
