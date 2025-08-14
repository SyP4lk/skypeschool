// client/app/(public)/layout.tsx
import type { ReactNode } from 'react';
import Header from '../components/Header';

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
    </>
  );
}
