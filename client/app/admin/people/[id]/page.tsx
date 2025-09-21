import { Suspense, use } from 'react';
import ProfileClient from './profile-client';

export default function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ role?: string }>;
}) {
  const { id } = use(params);
  const sp = searchParams ? use(searchParams) : undefined;
  const role = sp?.role === 'teacher' ? 'teacher' : 'student';
  return (
    <Suspense>
      <ProfileClient id={id} role={role as 'student' | 'teacher'} />
    </Suspense>
  );
}
