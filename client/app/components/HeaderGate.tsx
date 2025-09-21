'use client';

import { usePathname } from 'next/navigation';
import HeaderHome from './Header';
import HeaderAlt from './HeaderAlt';

export default function HeaderGate() {
  const pathname = usePathname() || '/';

  // Прячем публичную шапку на приватных/служебных страницах
  const hide =
    pathname === '/login' ||
    pathname === '/register' ||
    pathname.startsWith('/lk') ||
    pathname.startsWith('/admin');

  if (hide) return null;

  // Главная — оригинальная шапка
  if (pathname === '/') return <HeaderHome />;

  // Остальные публичные — альтернативная
  return <HeaderAlt />;
}
