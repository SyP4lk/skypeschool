import HeaderGate from './components/HeaderGate';
import './globals.css';
import type { ReactNode } from 'react';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <head />
      <HeaderGate />
      <body>{children}</body>
    </html>
  );
}