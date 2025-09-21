import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { ssrApiJson } from '@/lib/ssr';

export default async function Layout({ children }: { children: ReactNode }) {
  const me = await ssrApiJson('/auth/me').catch(()=>null);
  if (!me?.role) redirect('/login');
  if (String(me.role).toLowerCase() !== 'teacher') {
    const r = String(me.role || '').toLowerCase();
    if (r === 'admin') redirect('/admin');
    if (r === 'student') redirect('/lk/student');
    redirect('/login');
  }
return (
  <>
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
