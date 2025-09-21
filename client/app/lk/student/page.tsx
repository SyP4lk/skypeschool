'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

const API = (process.env.NEXT_PUBLIC_API_URL || '/api').replace(/\/$/, '');

type Me = {
  id: string;
  role: 'student'|'teacher'|'admin';
  login?: string|null;
  firstName?: string|null;
};

type Lesson = {
  id: string;
  studentId: string;
  teacherId: string;
  startsAt: string;
  status: 'scheduled'|'done'|'canceled_by_student'|'canceled_by_teacher';
  teacher?: { id: string; login?: string|null; firstName?: string|null } | null;
  priceMinor?: number|null;
};

export default function StudentLK() {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  // список ближайших уроков
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [items, setItems] = useState<Lesson[]>([]);
  const [total, setTotal] = useState(0);
  const pages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        fetch(API.replace(/\/api$/, ''), { credentials: 'include' }).catch(() => {});
        const r = await fetch(`${API}/auth/me`, { credentials: 'include' });
        if (!r.ok) throw new Error('unauthorized');
        const u: Me = await r.json();
        if (cancelled) return;
        setMe(u?.role === 'student' ? u : null);
      } catch {
        setMe(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // загрузка уроков
  const loadLessons = useCallback(async (toPage = page) => {
    const r = await fetch(`${API}/student/me/lessons?status=upcoming&page=${toPage}&limit=${limit}`, {
      credentials: 'include',
    });
    if (!r.ok) { setItems([]); setTotal(0); return; }
    const j = await r.json();
    setItems(Array.isArray(j?.items) ? j.items : (Array.isArray(j) ? j : []));
    setTotal(typeof j?.total === 'number' ? j.total : (Array.isArray(j) ? j.length : 0));
  }, [limit, page]);

  useEffect(() => {
    if (!me?.id) return;
    loadLessons(page).catch(() => {});
  }, [me?.id, page, loadLessons]);

  async function cancelLesson(id: string) {
    // отмена без Content-Type (urlencoded пустой — чтобы не было preflight)
    const body = new URLSearchParams();
    const r = await fetch(`${API}/student/me/lessons/${id}/cancel`, {
      method: 'POST',
      credentials: 'include',
      body,
    });
    if (r.ok) {
      alert('Урок отменён.');
      loadLessons(1).catch(() => {});
      setPage(1);
      return;
    }
    let msg = 'Не удалось отменить урок.';
    try {
      const j = await r.json();
      if (j?.message === 'too_late_to_cancel') msg = 'Слишком поздно для отмены урока.';
    } catch {}
    alert(msg);
  }

  const hello =
    me?.firstName?.trim()
      ? `Здравствуйте, ${me.firstName}!`
      : me?.login
        ? `Здравствуйте, ${me.login}!`
        : 'Здравствуйте!';

  if (loading) return <div className="p-6">Загрузка…</div>;
  if (!me) return <div className="p-6">Недостаточно прав. Пожалуйста, войдите как ученик.</div>;

  return (
    <div className="p-6">
      {/* Приветствие */}
      <div className="mb-4 rounded-xl border border-black/10 bg-white shadow-sm p-4 text-lg font-semibold">
        {hello}
      </div>

      {/* Ближайшие уроки */}
      <section className="rounded-xl border border-black/10 bg-white shadow-sm p-4">
        <div className="font-semibold mb-3">Ближайшие уроки</div>
        {items.length === 0 ? (
          <div className="text-sm opacity-70">Нет назначенных уроков.</div>
        ) : (
          <div className="flex flex-col gap-2">
            {items.map(l => {
              const starts = new Date(l.startsAt);
              const hoursTo = Math.round((starts.getTime() - Date.now()) / 3_600_000);
              const canCancel = starts.getTime() - Date.now() >= 8 * 3_600_000 && l.status === 'scheduled';
              return (
                <div key={l.id} className="flex items-center justify-between border rounded p-2">
                  <div className="flex flex-col">
                    <span className="text-sm">
                      Преподаватель: {l.teacher?.firstName || l.teacher?.login || l.teacherId}
                    </span>
                    <span className="text-sm opacity-70">
                      Начало: {starts.toLocaleString()} (≈ {hoursTo} ч)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm">
                      {typeof l.priceMinor === 'number' ? (l.priceMinor / 100).toFixed(2) + ' ₽' : '-'}
                    </div>
                    <button
                      className="border rounded px-3 py-1 disabled:opacity-50"
                      onClick={() => cancelLesson(l.id)}
                      disabled={!canCancel}
                      title={canCancel ? '' : 'Отмена доступна не позднее чем за 8 часов до начала'}
                    >
                      Отменить
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* пагинация */}
        <div className="flex gap-2 mt-3">
          <button
            className="border rounded px-3 py-1 disabled:opacity-50"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
          >Назад</button>
          <div className="px-2 py-1 text-sm">{page} / {pages}</div>
          <button
            className="border rounded px-3 py-1 disabled:opacity-50"
            onClick={() => setPage(p => Math.min(pages, p + 1))}
            disabled={page >= pages}
          >Вперёд</button>
        </div>
      </section>
    </div>
  );
}
