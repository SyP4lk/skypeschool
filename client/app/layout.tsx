import HeaderGate from './components/HeaderGate';
import './globals.css';
import type { ReactNode } from 'react';
import FooterGate from './components/FooterGate';
import Footer from './components/Footer';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <head />
      <HeaderGate />
      <body>{children}</body>
      <FooterGate/>
    </html>
  );
}