
'use client';
import { ToastProvider, useToast, installFetchToasts } from '../shared/ui/Toast';
import React, { useEffect } from 'react';

function FetchToastsInstaller() {
  const toast = useToast();
  useEffect(() => { installFetchToasts(toast); }, [toast]);
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
export { ToastProvider as Providers } from '../shared/ui/Toast';
