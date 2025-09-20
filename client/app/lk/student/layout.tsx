import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { ssrApiJson } from '@/lib/ssr';

export default async function Layout({ children }: { children: ReactNode }) {
  const me = await ssrApiJson('/auth/me').catch(()=>null);
  if (!me?.role) redirect('/login');
  if (String(me.role).toLowerCase() !== 'student') {
    const r = String(me.role || '').toLowerCase();
    if (r === 'admin') redirect('/admin');
    if (r === 'teacher') redirect('/lk/teacher');
    redirect('/login');
  }
  return <>{children}</>;
}
