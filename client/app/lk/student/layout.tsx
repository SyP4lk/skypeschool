'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let aborted = false;

    async function guard() {
      setReady(false);
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' });
        if (res.status === 401) { if (!aborted) router.replace('/login'); return; }
        if (!res.ok) throw new Error(await res.text());

        const data = await res.json();
        const role = String(data?.user?.role ?? data?.role ?? '').toLowerCase();

        if (role !== 'student') {
          if (!aborted) {
            if (role === 'admin') router.replace('/admin');
            else if (role === 'teacher') router.replace('/lk/teacher');
            else router.replace('/login');
          }
          return;
        }

        if (!aborted) setReady(true);
      } catch {
        if (!aborted) router.replace('/login');
      }
    }

    guard();
    return () => { aborted = true; };
  }, [router]);

  if (!ready) return <div className="min-h-screen bg-gray-50" />;

  return <>{children}</>;
}
