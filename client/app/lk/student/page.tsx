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
  price?: number | null; // в копейках
  status?: string | null;
  teacher?: { id: string; login?: string | null; firstName?: string | null; lastName?: string | null } | null;
  subjectName?: string | null;
  subjectId?: string | null;
  comment?: string | null;
};

function normalizeStatus(s?: string | null) {
  const v = String(s || '').toUpperCase();
  if (v.includes('DONE') || v.includes('COMPLETE')) return 'DONE';
  if (v.includes('CANCEL')) return 'CANCELED';
  if (v.includes('PLAN')) return 'PLANNED';
  return v || 'PLANNED';
}
const lDuration = (l: Lesson) => Number(l.durationMin ?? l.duration ?? 60);
const lPriceRub = (l: Lesson) => Number(l.price ?? 0) / 100;
const teacherLabel = (t?: Lesson['teacher']) => {
  if (!t) return '';
  const fio = [t.lastName, t.firstName].filter(Boolean).join(' ');
  return [t.login, fio].filter(Boolean).join(' — ');
};

export default function StudentLK() {
  const [balance, setBalance] = useState<number>(0);
  const [err, setErr] = useState<string|null>(null);
  const [msg, setMsg] = useState<string|null>(null);

  const [upcoming, setUpcoming] = useState<Lesson[]>([]);
  const [doneList, setDoneList] = useState<Lesson[]>([]);
  const [topupText, setTopupText] = useState<string>('');

  async function loadBalance() {
    const b = await api<{ balance: number; currency: string }>('/finance/me/balance');
    setBalance(Number(b?.balance ?? 0) / 100); // копейки → ₽
  }
  async function loadLessons() {
    const rows = await api<Lesson[]>('/student/me/lessons');
    const norm = (Array.isArray(rows) ? rows : []).map(l => ({ ...l, status: normalizeStatus(l.status) }));
    setUpcoming(norm.filter(l => l.status !== 'DONE' && l.status !== 'CANCELED').sort((a,b)=>+new Date(a.startsAt)-+new Date(b.startsAt)));
    setDoneList(norm.filter(l => l.status === 'DONE').sort((a,b)=>+new Date(b.startsAt)-+new Date(a.startsAt)));
  }
  async function loadTopupText() {
    try {
      const r = await api<{ text?: string }>('/student/me/topup-text');
      setTopupText(String(r?.text || ''));
    } catch { setTopupText(''); }
  }

const [msg, setMsg] = useState<string|null>(null);
const [err, setErr] = useState<string|null>(null);

function canCancel(startsAt: string) {
  try { return (new Date(startsAt).getTime() - Date.now()) >= EIGHT_HOURS_MS; } catch { return false; }
}
async function cancelLesson(id: string) {
  setErr(null); setMsg(null);
  try {
    await api(`/student/me/lessons/${id}/cancel`, { method: 'POST' });
    setMsg('Урок отменён');
    await loadLessons?.();
  } catch (e:any) {
    const m = String(e?.message || '');
    if (m === 'too_late_to_cancel') setErr('Отменить можно не позднее чем за 8 часов до начала');
    else setErr(m || 'Ошибка отмены');
  }
}

useEffect(() => {
    (async () => {
      try { await Promise.all([loadBalance(), loadLessons(), loadTopupText()]); }
      catch (e:any) { setErr(e?.message || 'Ошибка загрузки'); }
    })();
  }, []);

  return (
    <div className="max-w-3xl mx-auto py-6 space-y-6">
      <section className="rounded-xl border p-4">
        <div className="text-sm text-gray-500">Баланс</div>
        <div className="text-2xl mt-1">{fmtMoney.format(Number(balance || 0))}</div>
      </section>

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
                  <div className="text-sm">{fmtDate.format(new Date(l.startsAt))}{' '}{canCancel(l.startsAt) && (<button className="px-2 py-1 rounded border text-xs" onClick={()=>cancelLesson(l.id)}>Отменить</button>)}</div>
                  <div className="text-sm">{lDuration(l)} мин · {fmtMoney.format(lPriceRub(l))}</div>
                  {l.comment ? <div className="text-xs text-gray-500">Комментарий: {l.comment}</div> : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border p-4">
        <div className="font-semibold mb-3">Проведённые</div>
        {doneList.length === 0 ? (
          <div className="text-sm text-gray-500">Пока пусто</div>
        ) : (
          <div className="space-y-2">
            {doneList.map(l => (
              <div key={l.id} className="rounded border px-3 py-2 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div className="space-y-1">
                  <div className="font-medium">{l.subjectName || 'Предмет'}</div>
                  <div className="text-sm text-gray-600">{teacherLabel(l.teacher)}</div>
                  <div className="text-sm">{fmtDate.format(new Date(l.startsAt))}{' '}{canCancel(l.startsAt) && (<button className="px-2 py-1 rounded border text-xs" onClick={()=>cancelLesson(l.id)}>Отменить</button>)}</div>
                  <div className="text-sm">{lDuration(l)} мин · {fmtMoney.format(lPriceRub(l))}</div>
                </div>
                <div className="text-xs uppercase tracking-wide text-green-700 font-semibold">DONE</div>
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
