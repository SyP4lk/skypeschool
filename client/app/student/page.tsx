'use client';
import { useEffect, useState } from 'react';

type Lesson = {
  id: string;
  startsAt: string;
  duration: number;
  subject: { id: string; name: string };
  teacher: { id: string; firstName?: string|null; lastName?: string|null; login: string };
};

export default function StudentCabinet() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const base = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/+$/, '');
      try {
        const r = await fetch(`${base}/lessons?studentId=me`, { credentials: 'include', cache: 'no-store' });
        if (r.ok) setLessons(await r.json());
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <main className="container mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">Личный кабинет ученика</h1>
      <div className="mb-4">
        <a href="/teachers" className="rounded-xl bg-blue-600 px-4 py-2 text-white">Выбрать преподавателя</a>
      </div>
      {loading ? <div>Загрузка…</div> : (
        <div className="space-y-3">
          {lessons.length === 0 && <div className="text-slate-600">Пока нет предстоящих уроков.</div>}
          {lessons.map(ls => (
            <div key={ls.id} className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{ls.subject?.name ?? 'Урок'}</div>
                  <div className="text-sm text-slate-600">
                    Преподаватель: {ls.teacher?.firstName || ls.teacher?.lastName
                      ? `${ls.teacher.firstName ?? ''} ${ls.teacher.lastName ?? ''}`.trim()
                      : ls.teacher?.login}
                  </div>
                </div>
                <div className="text-right text-sm text-slate-700">
                  {(new Date(ls.startsAt)).toLocaleString()} · {ls.duration} мин
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
