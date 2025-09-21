import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { ssrApiJson } from '@/lib/ssr';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // Всегда проверяем роль с сервера по куке
  const me = await ssrApiJson('/auth/me').catch(() => null);
  if (!me?.role) redirect('/login');

  const role = String(me.role).toLowerCase();
  if (role !== 'admin') {
    // Не админов выкидываем в их ЛК (как раньше), но администраторов — оставляем
    if (role === 'teacher') redirect('/lk/teacher');
    if (role === 'student') redirect('/lk/student');
    redirect('/login');
  }

  // НИКАКИХ client-side редиректов здесь.
  return <>{children}</>
}
