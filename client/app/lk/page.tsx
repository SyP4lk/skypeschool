import { redirect } from 'next/navigation';
import { ssrApiJson } from '@/lib/ssr';

export const dynamic = 'force-dynamic';

export default async function LkIndex() {
  const me = await ssrApiJson('/auth/me').catch(() => null);
  if (!me?.role) redirect('/login');
  const r = String(me.role || '').toLowerCase();
  if (r === 'admin') redirect('/admin');
  if (r === 'teacher') redirect('/lk/teacher');
  redirect('/lk/student');
}
