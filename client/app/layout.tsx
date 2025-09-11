import './globals.css';
import type { ReactNode } from 'react';
import AOSInit from './components/AOSInit';
import HeaderGate from './components/HeaderGate';
import FooterGate from './components/FooterGate';
import { Providers } from './providers';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <head />
      <body className="antialiased">
        <AOSInit />
        <Providers>
          <HeaderGate />
          {children}
          <FooterGate />
        </Providers>
      </body>
    </html>
  );
}
