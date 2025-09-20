
'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { API, fetchJSON, Me } from '../lib/api';

type Props = {
  allowed: Array<'admin'|'teacher'|'student'>;
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

function routeForRole(role: Me['role']) {
  if (role === 'admin') return '/admin';
  if (role === 'teacher') return '/lk/teacher';
  return '/lk/student';
}

export default function RoleGate({ allowed, children, fallback }: Props) {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const redirected = useRef(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const m = await fetchJSON<Me>(`${API}/auth/me`);
        if (!mounted) return;
        setMe(m);
        if (!allowed.includes(m.role)) {
          const dest = routeForRole(m.role);
          if (!redirected.current && dest !== pathname) {
            redirected.current = true;
            router.replace(dest);
          }
        }
      } catch {
        if (!redirected.current && pathname !== '/login') {
          redirected.current = true;
          router.replace('/login');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (loading) return (fallback ?? <div className="p-6 text-sm opacity-70">Загрузка…</div>);
  if (!me) return null;
  if (allowed.includes(me.role)) return <>{children}</>;
  return null;
}
