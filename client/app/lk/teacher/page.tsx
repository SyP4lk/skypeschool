'use client';

import { useEffect, useMemo, useState } from 'react';

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
  startsAt: string; // ISO
  status: 'scheduled'|'done'|'canceled_by_student'|'canceled_by_teacher';
  priceMinor?: number|null;
  student?: { id: string; login?: string|null; firstName?: string|null } | null;
};

export default function TeacherLK() {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  // список ближайших уроков
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [items, setItems] = useState<Lesson[]>([]);
  const [total, setTotal] = useState(0);
  const pages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

  // форма создания урока
  const [form, setForm] = useState<{ studentId: string; startsAt: string; priceMinor: string }>({
    studentId: '',
    startsAt: '',
    priceMinor: '',
  });
  const onForm = (k: keyof typeof form, v: string) => setForm(s => ({ ...s, [k]: v }));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // прогрев
        fetch(API.replace(/\/api$/, ''), { credentials: 'include' }).catch(() => {});
        const r = await fetch(`${API}/auth/me`, { credentials: 'include' });
        if (!r.ok) throw new Error('unauthorized');
        const u: Me = await r.json();
        if (cancelled) return;
        setMe(u?.role === 'teacher' ? u : null);
      } catch {
        setMe(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // загрузка уроков (только если teacher)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!me?.id) return;
      try {
        const r = await fetch(`${API}/teacher/me/lessons?status=upcoming&page=${page}&limit=${limit}`, {
          credentials: 'include',
        });
        if (!r.ok) throw new Error();
        const j = await r.json();
        if (cancelled) return;
        setItems(Array.isArray(j?.items) ? j.items : (Array.isArray(j) ? j : []));
        setTotal(typeof j?.total === 'number' ? j.total : (Array.isArray(j) ? j.length : 0));
      } catch {
        if (!cancelled) { setItems([]); setTotal(0); }
      }
    })();
    return () => { cancelled = true; };
  }, [me?.id, page, limit]);

  async function createLesson(e: React.FormEvent) {
    e.preventDefault();
    const body = new URLSearchParams();
    if (form.studentId) body.append('studentId', form.studentId);
    if (form.startsAt) body.append('startsAt', form.startsAt);
    if (form.priceMinor) body.append('priceMinor', form.priceMinor);

    const r = await fetch(`${API}/teacher/me/lessons`, {
      method: 'POST',
      credentials: 'include',
      body, // НЕ ставим Content-Type — избегаем preflight
    });

    if (r.ok) {
      alert('Урок назначен.');
      // перезагрузим список
      setPage(1);
      try {
        const rr = await fetch(`${API}/teacher/me/lessons?status=upcoming&page=1&limit=${limit}`, { credentials: 'include' });
        const j = await rr.json();
        setItems(Array.isArray(j?.items) ? j.items : (Array.isArray(j) ? j : []));
        setTotal(typeof j?.total === 'number' ? j.total : (Array.isArray(j) ? j.length : 0));
      } catch {}
      return;
    }

    // читаем человеко-понятную ошибку
    let msg = 'Не удалось назначить урок.';
    try {
      const j = await r.json();
      if (j?.message === 'insufficient_funds') msg = 'У ученика недостаточно средств.';
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
  if (!me) return <div className="p-6">Недостаточно прав. Пожалуйста, войдите как преподаватель.</div>;

  return (
    <div className="p-6">
      {/* Приветствие */}
      <div className="mb-4 rounded-xl border border-black/10 bg-white shadow-sm p-4 text-lg font-semibold">
        {hello}
      </div>

      {/* Назначить урок */}
      <section className="mb-6 rounded-xl border border-black/10 bg-white shadow-sm p-4">
        <div className="font-semibold mb-3">Назначить урок</div>
        <form onSubmit={createLesson} className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <input
            className="border rounded p-2"
            placeholder="ID ученика"
            value={form.studentId}
            onChange={e => onForm('studentId', e.target.value)}
            required
          />
          <input
            className="border rounded p-2"
            type="datetime-local"
            placeholder="Начало"
            value={form.startsAt}
            onChange={e => onForm('startsAt', e.target.value)}
            required
          />
          <input
            className="border rounded p-2"
            type="number"
            placeholder="Цена, копейки (например 150000 = 1500₽)"
            value={form.priceMinor}
            onChange={e => onForm('priceMinor', e.target.value)}
            min={0}
            required
          />
          <button className="bg-black text-white rounded p-2">Назначить</button>
        </form>
        <div className="text-sm opacity-70 mt-2">
          При недостаточном балансе ученика система вернёт ошибку, урок не создастся.
        </div>
      </section>

      {/* Ближайшие уроки */}
      <section className="rounded-xl border border-black/10 bg-white shadow-sm p-4">
        <div className="font-semibold mb-3">Ближайшие уроки</div>
        {items.length === 0 ? (
          <div className="text-sm opacity-70">Нет назначенных уроков.</div>
        ) : (
          <div className="flex flex-col gap-2">
            {items.map(l => (
              <div key={l.id} className="flex items-center justify-between border rounded p-2">
                <div className="flex flex-col">
                  <span className="text-sm">
                    Ученик: {l.student?.firstName || l.student?.login || l.studentId}
                  </span>
                  <span className="text-sm opacity-70">
                    Начало: {new Date(l.startsAt).toLocaleString()}
                  </span>
                </div>
                <div className="text-sm">
                  {typeof l.priceMinor === 'number' ? (l.priceMinor / 100).toFixed(2) + ' ₽' : '-'}
                </div>
              </div>
            ))}
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
