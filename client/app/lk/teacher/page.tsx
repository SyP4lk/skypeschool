'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL!;

type Me = {
  id: string;
  login: string;
  role: 'student' | 'teacher' | 'admin';
  firstName?: string | null;
  lastName?: string | null;
};

export default function TeacherLK() {
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        fetch(API.replace(/\/api$/, ''), { method: 'GET', credentials: 'include' }).catch(() => {});
        const r = await fetch(`${API}/auth/me`, { credentials: 'include' });
        if (r.ok) {
          const u: Me = await r.json();
          if (u.role !== 'teacher') {
            router.replace(u.role === 'student' ? '/lk/student' : u.role === 'admin' ? '/admin' : '/login');
            return;
          }
          setMe(u);
        } else {
          router.replace('/login');
        }
      } catch (e: any) {
        setError(e?.message || 'Ошибка');
      }
    })();
  }, [router]);

  const hello = me?.firstName?.trim()
    ? `Здравствуйте, ${me.firstName}!`
    : me ? `Здравствуйте, ${me.login}!` : '';

  return (
    <div className="p-6">
      {hello && (
        <div className="mb-4 rounded-xl border border-black/10 bg-white shadow-sm p-4 text-lg font-semibold">
          {hello}
        </div>
      )}

      {error && <div className="mb-4 text-red-600">{error}</div>}

      {/* TODO: остальной контент остаётся как в текущей версии */}
    </div>
  );
}
