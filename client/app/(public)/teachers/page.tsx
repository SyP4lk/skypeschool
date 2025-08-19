import { Suspense } from 'react';
import TeachersClient from './teachers-client';

export const dynamic = 'force-dynamic'; // не жёстко пререндерим страницу

export default function Page() {
  return (
    <Suspense fallback={<div className="container py-8">Загрузка…</div>}>
      <TeachersClient />
    </Suspense>
  );
}
