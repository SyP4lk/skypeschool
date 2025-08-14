// client/app/login/layout.tsx
import type { ReactNode } from 'react';
import './login.css';
// НЕ импортируем globals.css здесь!
// Если нужны спец-стили логина – подключай login.css (scoped, не глобалка!)
export default function LoginLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;}