'use client';
import { usePathname } from 'next/navigation';
import Footer from './Footer';

const HIDE = [/^\/login(?:$|\b)/, /^\/admin(?:$|\b)/];

export default function FooterGate() {
  const p = usePathname();
  const hide = HIDE.some(r => r.test(p));
  if (hide) return null;
  return <Footer />;
}
