'use client';
import { useEffect, useMemo, useState } from 'react';
import { api } from './_lib/api';

const EIGHT_HOURS_MS = 8 * 60 * 60 * 1000;

const fmtMoney = new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' });
const fmtDate = new Intl.DateTimeFormat(undefined, {
  year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
});

type Lesson = {
  id: string;
  startsAt: string;
  duration?: number | null;
  durationMin?: number | null;
  price?: number | null; // копейки
  status?: string | null;
  subjectName?: string | null;
  teacher?: { firstName?: string|null; lastName?: string|null; login?: string|null } | null;
  comment?: string | null;
};

function lDuration(l: Lesson) { return Number(l.durationMin ?? l.duration ?? 60) || 60; }
function lPriceRub(l: Lesson) {
  const minor = Number.isFinite(Number(l.price)) ? Number(l.price) : 0;
  return minor / 100;
}
function teacherLabel(t?: Lesson['teacher']) {
  const f = t?.firstName?.trim(); const l = t?.lastName?.trim();
  return (f || l) ? `${f || ''} ${l || ''}`.trim() : (t?.login || 'Преподаватель');
}
function normalizeStatus(s?: string | null) {
  const v = String(s || '').toUpperCase();
  if (v.includes('DONE') || v.includes('COMPLETE')) return 'DONE';
  if (v.includes('CANCEL')) return 'CANCELED';
  if (v.includes('PLAN')) return 'PLANNED';
  return v || 'PLANNED';
}

export default function StudentLK() {
  const [upcoming, setUpcoming] = useState<Lesson[]>([]);
  const [history, setHistory] = useState<Lesson[]>([]);
  const [topupText, setTopupText] = useState('');

  // ЕДИНСТВЕННОЕ объявление локальных уведомлений
  const [msg, setMsg] = useState<string|null>(null);
  const [err, setErr] = useState<string|null>(null);

  async function loadLessons() {
    setErr(null);
    const { lessons } = await api<{lessons:any[]}>('/student/me/lessons');
    const norm = (lessons || []).map((l:any) => ({
      id: l.id, startsAt: l.startsAt, duration: l.duration, durationMin: l.durationMin, price: l.priceMinor ?? l.price,
      status: normalizeStatus(l.status), subjectName: l.subject?.name ?? l.subjectName,
      teacher: l.teacher ? { firstName: l.teacher.firstName, lastName: l.teacher.lastName, login: l.teacher.login } : null,
      comment: l.comment,
    }));
    setUpcoming(
      norm
        .filter(l => l.status !== 'DONE' && l.status !== 'CANCELED')
        .sort((a,b)=>+new Date(a.startsAt)-+new Date(b.startsAt))
    );
    setHistory(
      norm
        .filter(l => l.status === 'DONE' || l.status === 'CANCELED')
        .sort((a,b)=>+new Date(b.startsAt)-+new Date(a.startsAt))
    );
  }

  function canCancel(startsAt: string) {
    try { return (new Date(startsAt).getTime() - Date.now()) >= EIGHT_HOURS_MS; } catch { return false; }
  }

  async function cancelLesson(id: string) {
    setErr(null); setMsg(null);
    try {
      await api(`/student/me/lessons/${id}/cancel`, { method: 'POST' });
      setMsg('Урок отменён');
      await loadLessons();
    } catch (e:any) {
      const m = String(e?.message || '');
      if (m === 'too_late_to_cancel') setErr('Отменить можно не позднее чем за 8 часов до начала');
      else setErr(m || 'Ошибка отмены');
    }
  }

  async function loadTopupText() {
    const { text } = await api<{text:string}>('/student/me/topup-text').catch(()=>({text:''}));
    setTopupText(text || '');
  }

  useEffect(() => {
    (async () => {
      try { await Promise.all([loadLessons(), loadTopupText()]); }
      catch (e:any) { setErr(e?.message || 'Ошибка загрузки'); }
    })();
  }, []);

  return (
    <div className="space-y-4">
      <section className="rounded-xl border p-4">
        <div className="font-semibold mb-3">Предстоящие уроки</div>
        {upcoming.length === 0 ? (
          <div className="text-sm text-gray-500">Пока пусто</div>
        ) : (
          <div className="space-y-2">
            {upcoming.map(l => (
              <div key={l.id} className="rounded border px-3 py-2 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div className="space-y-1">
                  <div className="font-medium">{l.subjectName || 'Предмет'}</div>
                  <div className="text-sm text-gray-600">{teacherLabel(l.teacher)}</div>
                  <div className="text-sm">
                    {fmtDate.format(new Date(l.startsAt))}{' '}
                    {canCancel(l.startsAt) && (
                      <button className="px-2 py-1 rounded border text-xs" onClick={() => cancelLesson(l.id)}>Отменить</button>
                    )}
                  </div>
                  <div className="text-sm">{lDuration(l)} мин · {fmtMoney.format(lPriceRub(l))}</div>
                  {l.comment ? <div className="text-xs text-gray-500">Комментарий: {l.comment}</div> : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border p-4">
        <div className="font-semibold mb-3">Прошедшие/отменённые</div>
        {history.length === 0 ? (
          <div className="text-sm text-gray-500">Пока пусто</div>
        ) : (
          <div className="space-y-2">
            {history.map(l => (
              <div key={l.id} className="rounded border px-3 py-2">
                <div className="font-medium">{l.subjectName || 'Предмет'}</div>
                <div className="text-sm">{fmtDate.format(new Date(l.startsAt))} — {normalizeStatus(l.status)}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border p-4">
        <div className="font-semibold mb-3">Как пополнить</div>
        {topupText ? (
          <pre className="whitespace-pre-wrap text-sm leading-6">{topupText}</pre>
        ) : (
          <div className="text-sm text-gray-500">Инструкция пока не добавлена.</div>
        )}
      </section>

      {msg && <div className="text-sm text-green-700 mb-2">{msg}</div>}
      {err && <div className="text-sm text-red-600">{err}</div>}
    </div>
  );
}
