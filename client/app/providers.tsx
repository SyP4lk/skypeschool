
'use client';
import { ToastProvider } from '../shared/ui/Toast';

export default function Providers({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}
export { ToastProvider as Providers } from '../shared/ui/Toast';
