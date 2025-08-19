'use client';
import { useEffect, useState } from 'react';

type Lesson = {
  id: string;
  startsAt: string;
  duration: number;
  subject: { id: string; name: string };
  student: { id: string; firstName?: string|null; lastName?: string|null; login: string };
  note?: string | null;
};

export default function TeacherCabinet() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const base = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/+$/, '');
    try {
      const r = await fetch(`${base}/lessons?teacherId=me`, { credentials: 'include', cache: 'no-store' });
      if (r.ok) setLessons(await r.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const saveNote = async (id: string, note: string) => {
    setSaving(id);
    const base = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/+$/, '');
    try {
      await fetch(`${base}/lessons/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ note }),
      });
      await load();
    } finally {
      setSaving(null);
    }
  };

  return (
    <main className="container mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">Кабинет преподавателя</h1>
      {loading ? <div>Загрузка…</div> : (
        <div className="space-y-3">
          {lessons.length === 0 && <div className="text-slate-600">Пока нет назначенных уроков.</div>}
          {lessons.map(ls => (
            <div key={ls.id} className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{ls.subject?.name ?? 'Урок'}</div>
                  <div className="text-sm text-slate-600">
                    Ученик: {ls.student?.firstName || ls.student?.lastName
                      ? `${ls.student.firstName ?? ''} ${ls.student.lastName ?? ''}`.trim()
                      : ls.student?.login}
                  </div>
                </div>
                <div className="text-right text-sm text-slate-700">
                  {(new Date(ls.startsAt)).toLocaleString()} · {ls.duration} мин
                </div>
              </div>
              <div className="mt-3">
                <label className="block text-sm mb-1">Заметка (видна только вам)</label>
                <textarea
                  defaultValue={ls.note ?? ''}
                  className="w-full rounded border border-slate-300 p-2"
                  onBlur={(e) => saveNote(ls.id, e.target.value)}
                  disabled={saving === ls.id}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
