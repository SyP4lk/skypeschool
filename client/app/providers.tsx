
'use client';
import { ToastProvider } from '../shared/ui/Toast';

function Providers({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}

export default Providers;
export { Providers };
