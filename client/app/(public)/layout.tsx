// client/app/(public)/layout.tsx
import type { ReactNode } from 'react';
import Header from '../components/Header';
import SupportWidget from '@/app/components/support/SupportWidget';
export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <SupportWidget />
    </>
  );
}
