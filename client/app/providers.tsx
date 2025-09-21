'use client';
import React, { useEffect } from 'react';
import { ToastProvider, useToast, installFetchToasts } from '../shared/ui/Toast';

function FetchToastsInstaller() {
  const toast = useToast();
  useEffect(() => {
    installFetchToasts(toast);
  }, [toast]);
  return null;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <FetchToastsInstaller />
      {children}
    </ToastProvider>
  );
}

// если где-то импортируется именованный Providers — пусть тоже работает
export { ToastProvider as Providers } from '../shared/ui/Toast';
