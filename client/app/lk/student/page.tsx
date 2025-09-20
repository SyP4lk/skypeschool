
'use client';
import { useEffect, useState } from 'react';
import Greeting from '@/shared/ui/Greeting';
import { useToast } from '@/shared/ui/Toast';

const API = (process.env.NEXT_PUBLIC_API_URL || '/api').replace(/\/$/, '');

type Me = { id: string; firstName?: string|null; login?: string|null };
type Lesson = { id: string; startsAt: string; status: string; teacher?: { user?: { firstName?: string|null } } };

export default function StudentLK() {
  const toast = useToast();
  const [me, setMe] = useState<Me | null>(null);
  const [items, setItems] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [m, list] = await Promise.all([
        fetch(`${API}/auth/me`, { credentials: 'include' }).then(r => r.json()),
        fetch(`${API}/student/me/lessons?status=scheduled&page=1&limit=20`, { credentials: 'include' }).then(r => r.json()).catch(() => ({ items: [] })),
      ]);
      setMe(m);
      setItems(list.items || list || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function cancel(id: string, startsAt: string) {
    const diffHrs = (new Date(startsAt).getTime() - Date.now()) / 3_600_000;
    if (diffHrs < 8) {
      toast({ type: 'error', message: 'Отменять можно не позднее чем за 8 часов до начала.' });
      return;
    }
    const r = await fetch(`${API}/student/me/lessons/${id}/cancel`, { method: 'POST', credentials: 'include' });
    if (r.ok) {
      toast({ type: 'success', message: 'Урок отменён.' });
      await load();
    } else {
      let msg = 'Не удалось отменить урок.';
      try { const j = await r.json(); if (j?.message === 'too_late_to_cancel') msg = 'Слишком поздно для отмены урока.'; } catch {}
      toast({ type: 'error', message: msg });
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <Greeting firstName={me?.firstName} login={me?.login} />
      <h3 className="font-semibold mb-2">Ближайшие уроки</h3>
      {loading ? 'Загрузка…' : (
        <div className="flex flex-col gap-2">
          {items.map(l => (
            <div key={l.id} className="border rounded-lg p-3 flex items-center justify-between">
              <div className="text-sm">
                <div className="font-medium">{new Date(l.startsAt).toLocaleString()}</div>
                <div className="opacity-70">Преподаватель: {l.teacher?.user?.firstName || '—'}</div>
              </div>
              <button className="text-red-600" onClick={() => cancel(l.id, l.startsAt)}>Отменить</button>
            </div>
          ))}
          {!items.length && <div className="opacity-60 text-sm">Нет назначенных уроков.</div>}
        </div>
      )}
    </div>
  );
}
