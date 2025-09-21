import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { ssrApiJson } from '@/lib/ssr';

export default async function Layout({ children }: { children: ReactNode }) {
  const me = await ssrApiJson('/auth/me').catch(() => null);
  if (!me?.role) redirect('/login');

  const role = String(me.role).toLowerCase();
  if (role !== 'student') {
    if (role === 'teacher') redirect('/lk/teacher');
    if (role === 'admin') redirect('/admin');
    redirect('/login');
  }

  return (
    <>
      {/* Приветствие — маленькая строка, не ломает сетку */}
      <div className="mb-2 text-sm">
        {(() => {
          const name = (me && (me.firstName || me.login)) || '';
          return <>Здравствуйте{ name ? `, ${name}` : '' }!</>;
        })()}
      </div>

      {children}
    </>
  );
}
