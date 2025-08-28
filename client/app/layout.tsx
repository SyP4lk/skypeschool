import HeaderGate from './components/HeaderGate';
import './globals.css';
import AOSInit from './components/AOSInit';
import type { ReactNode } from 'react';
import FooterGate from './components/FooterGate';
import { Providers } from "./providers";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <head />
      <HeaderGate />
      <body className="antialiased"> <AOSInit /><Providers>{children}</Providers></body>
      <FooterGate/>
    </html>
  );
}