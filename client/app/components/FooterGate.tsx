'use client';
import { usePathname } from 'next/navigation';
import Footer from './Footer';

export default function FooterGate() {
  const p = usePathname() || '/';
  const hide =
    p === '/login' ||
    p === '/register' ||
    p.startsWith('/lk') ||
    p.startsWith('/admin');

  if (hide) return null;
  return <Footer />;
}
