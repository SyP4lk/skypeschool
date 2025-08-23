import { Suspense } from 'react';
import ProfileClient from './profile-client';

export default function Page({ params, searchParams }: { params: { id: string }, searchParams: { role?: string } }) {
  const role = searchParams?.role === 'teacher' ? 'teacher' : 'student';
  return (
    <Suspense>
      <ProfileClient id={params.id} role={role as 'student' | 'teacher'} />
    </Suspense>
  );
}
