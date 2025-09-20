'use client';
import { useEffect, useMemo, useState } from 'react';
import { api } from './_lib/api';

const fmtMoney = new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' });
const fmtDate = new Intl.DateTimeFormat(undefined, {
  year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
});

type Subject = { subjectId: string; name: string; price: number; durationMin: number };
type Lesson = {
  id: string;
  startsAt: string;
  duration?: number | null;
  durationMin?: number | null;
  price?: number | null;          // старые записи: рубли
  priceCents?: number | null;     // новые записи: копейки
  status?: string | null;         // planned/completed/cancelled|DONE|...
  student?: { id: string; login?: string | null; firstName?: string | null; lastName?: string | null } | null;
  subjectName?: string | null;
  subjectId?: string | null;
  comment?: string | null;
};

// === helpers ===
function normalizeStatus(s?: string | null): 'PLANNED'|'DONE'|'CANCELED' {
  const v = String(s || '').trim().toLowerCase();
  if (v === 'completed' || v === 'done') return 'DONE';
  if (v === 'cancelled' || v === 'canceled') return 'CANCELED';
  return 'PLANNED';
}
const lDuration = (l: Lesson) => Number(l.durationMin ?? l.duration ?? 60);

// приведение к копейкам (унификация старых/новых записей)
const lPriceCents = (l: Lesson) => {
  const pc = Number((l as any).priceCents);
  if (Number.isFinite(pc) && pc > 0) return pc;
  const p = Number(l.price ?? 0);
  if (!Number.isFinite(p) || p <= 0) return 0;
  // если выглядит как рубли — умножаем
  return p >= 1000 ? Math.round(p) : Math.round(p * 100);
};

const studentLabel = (st?: Lesson['student']) => {
  if (!st) return '';
  const fio = [st.lastName, st.firstName].filter(Boolean).join(' ');
  return [st.login, fio].filter(Boolean).join(' — ');
};

export default function TeacherLK() {
  const [balance, setBalance] = useState<number>(0);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [err, setErr] = useState<string|null>(null);
  const [msg, setMsg] = useState<string|null>(null);

  const [studentQuery, setStudentQuery] = useState('');
  const [studentId, setStudentId] = useState<string>('');
  const [studentList, setStudentList] = useState<{id:string;label:string}[]>([]);

  const [subjectId, setSubjectId] = useState('');
  const [startsAtLocal, setStartsAtLocal] = useState('');
  const [duration, setDuration] = useState('');
  const [price, setPrice] = useState(''); // ₽ для инпута
  const [comment, setComment] = useState('');

  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawNotes, setWithdrawNotes] = useState('');

  const [upcoming, setUpcoming] = useState<Lesson[]>([]);
  const [doneList, setDoneList] = useState<Lesson[]>([]);

  const activeSubject = useMemo(
    () => subjects.find(s => s.subjectId === subjectId),
    [subjects, subjectId],
  );

  async function loadBalance() {
    const b = await api<{ balance: number; currency: string }>('/finance/me/balance');
    setBalance(Number(b?.balance ?? 0) / 100); // копейки → ₽
  }
  async function loadSubjects() {
    const subs = await api<Subject[]>('/teacher/me/subjects');
    setSubjects(Array.isArray(subs) ? subs : []);
  }
  async function loadLessons() {
    const rows = await api<Lesson[]>('/teacher/me/lessons');
    const norm = (Array.isArray(rows) ? rows : []).map(l => ({ ...l, status: normalizeStatus(l.status) }));
    setUpcoming(
      norm
        .filter(l => l.status === 'PLANNED')
        .sort((a,b)=>+new Date(a.startsAt)-+new Date(b.startsAt))
    );
    setDoneList(
      norm
        .filter(l => l.status === 'DONE')
        .sort((a,b)=>+new Date(b.startsAt)-+new Date(a.startsAt))
    );
  }

  useEffect(() => {
    (async () => {
      try { await Promise.all([loadBalance(), loadSubjects(), loadLessons()]); }
      catch (e:any) { setErr(e?.message || 'Ошибка загрузки'); }
    })();
  }, []);

  useEffect(() => {
    if (activeSubject) {
      if (!duration) setDuration(String(activeSubject.durationMin || ''));
      if (!price) setPrice(String(activeSubject.price || ''));
    }
  }, [activeSubject]);

  useEffect(() => {
    const q = studentQuery.trim();
    if (q.length < 2) { setStudentList([]); return; }
    const ctrl = new AbortController();
    api<{ id: string; label: string }[]>(
      `/teacher/me/students?q=${encodeURIComponent(q)}`,
      { signal: ctrl.signal as any },
    ).then(list => setStudentList(Array.isArray(list) ? list : []))
     .catch(() => {});
    return () => ctrl.abort();
  }, [studentQuery]);

  async function createLesson() {
    setErr(null); setMsg(null);
    try {
      if (!studentId) throw new Error('Выберите ученика');
      if (!subjectId) throw new Error('Выберите предмет');
      if (!startsAtLocal) throw new Error('Укажите дату и время');

      const startsAt = new Date(startsAtLocal);
      const durationMin = parseInt(duration || '0', 10);

      // ₽ → копейки
      const priceRub = parseFloat((price || '0').replace(',', '.'));
      const priceKop = Math.round(priceRub * 100);
      if (!Number.isFinite(durationMin) || durationMin <= 0) throw new Error('Некорректная длительность');
      if (!Number.isFinite(priceKop) || priceKop <= 0) throw new Error('Некорректная цена');

      await api('/teacher/me/lessons', {
        method: 'POST',
        body: JSON.stringify({
          studentId,
          subjectId,
          startsAt: startsAt.toISOString(),
          durationMin,
          price: priceKop, // отправляем в копейках
          comment: comment || null,
        }),
      });

      setMsg('Урок назначен');
      setStudentId(''); setStudentQuery(''); setSubjectId(''); setStartsAtLocal('');
      setDuration(''); setPrice(''); setComment('');
      await loadLessons(); // обновим списки без перезагрузки
    } catch (e: any) { setErr(e?.message || 'Ошибка'); }
  }

  async function markDone(lessonId: string) {
    setErr(null); setMsg(null);
    // оптимистично переносим в "проведённые"
    const l = upcoming.find(x => x.id === lessonId);
    if (l) {
      setUpcoming(prev => prev.filter(x => x.id !== lessonId));
      setDoneList(prev => [{ ...l, status: 'DONE' }, ...prev]);
    }
    try {
      await api(`/teacher/me/lessons/${lessonId}/done`, { method: 'PATCH' });
      await loadBalance();
      setMsg('Урок проведён');
    } catch (e: any) {
      await loadLessons(); // откат до серверного состояния
      setErr(e?.message || 'Не удалось завершить урок');
    }
  }

  async function cancelLesson(lessonId: string) {
    setErr(null); setMsg(null);
    const backup = upcoming;
    setUpcoming(prev => prev.filter(x => x.id !== lessonId));
    try {
      await api(`/teacher/me/lessons/${lessonId}/cancel`, { method: 'PATCH' });
      setMsg('Урок отменён');
    } catch (e:any) {
      setUpcoming(backup);
      setErr(e?.message || 'Не удалось отменить урок');
    }
  }

  async function createWithdraw() {
    setErr(null); setMsg(null);
    try {
      const amountRub = parseFloat((withdrawAmount || '0').replace(',', '.'));
      const amount = Math.round(amountRub); // на вывод — целые ₽
      if (!amount || amount <= 0) throw new Error('Введите сумму в ₽');
      await api('/withdrawals/teacher/me', {
        method: 'POST',
        body: JSON.stringify({ amount, notes: withdrawNotes || '' }),
      });
      setMsg('Заявка отправлена'); setWithdrawAmount(''); setWithdrawNotes('');
    } catch (e: any) { setErr(e?.message || 'Ошибка вывода'); }
  }

  return (
    <div className="max-w-3xl mx-auto py-6 space-y-6">
      <section className="rounded-xl border p-4">
        <div className="text-sm text-gray-500">Баланс</div>
        <div className="text-2xl mt-1">{fmtMoney.format(Number(balance || 0))}</div>
      </section>

      <section className="rounded-xl border p-4">
        <div className="font-semibold mb-3">Назначить урок</div>
        <div className="grid md:grid-cols-2 gap-3">
          <div className="md:col-span-2">
            <label className="text-sm block mb-1">Ученик</label>
            <div className="relative">
              <input
                className="w-full rounded border px-3 py-2"
                value={studentQuery}
                onChange={(e) => { setStudentQuery(e.target.value); setStudentId(''); }}
                placeholder="Начните вводить логин / имя / телефон"
              />
              {studentList.length > 0 && (
                <div className="absolute z-10 bg-white border rounded mt-1 w-full max-h-56 overflow-auto">
                  {studentList.map(o => (
                    <div
                      key={o.id}
                      className={`px-3 py-2 hover:bg-gray-100 cursor-pointer ${o.id === studentId ? 'bg-gray-100' : ''}`}
                      onClick={() => { setStudentId(o.id); setStudentQuery(o.label); }}
                    >
                      {o.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="text-sm block mb-1">Предмет</label>
            <select className="w-full rounded border px-3 py-2" value={subjectId} onChange={(e)=>setSubjectId(e.target.value)}>
              <option value="">— выберите —</option>
              {subjects.map(s => <option key={s.subjectId} value={s.subjectId}>{s.name}</option>)}
            </select>
          </div>

          <div>
            <label className="text-sm block mb-1">Начало</label>
            <input type="datetime-local" className="w-full rounded border px-3 py-2" value={startsAtLocal} onChange={(e)=>setStartsAtLocal(e.target.value)} />
          </div>

          <div>
            <label className="text-sm block mb-1">Длительность (мин)</label>
            <input className="w-full rounded border px-3 py-2" value={duration} onChange={(e)=>setDuration(e.target.value)} />
          </div>
          <div>
            <label className="text-sm block mb-1">Цена (₽)</label>
            <input className="w-full rounded border px-3 py-2" value={price} onChange={(e)=>setPrice(e.target.value)} />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm block mb-1">Комментарий</label>
            <input className="w-full rounded border px-3 py-2" value={comment} onChange={(e)=>setComment(e.target.value)} />
          </div>
        </div>
        <div className="mt-3">
          <button className="px-3 py-2 rounded border" onClick={createLesson}>Создать</button>
          {msg && <span className="text-green-700 text-sm ml-3">{msg}</span>}
          {err && <span className="text-red-600 text-sm ml-3">{err}</span>}
        </div>
      </section>

      {/* Предстоящие уроки */}
      <section className="rounded-xl border p-4">
        <div className="font-semibold mb-3">Предстоящие уроки</div>
        {upcoming.length === 0 ? (
          <div className="text-sm text-gray-500">Пока пусто</div>
        ) : (
          <div className="space-y-2">
            {upcoming.map(l => (
              <div key={l.id} className="rounded border px-3 py-2 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div className="space-y-1">
                  <div className="font-medium">{l.subjectName || subjects.find(s=>s.subjectId===l.subjectId)?.name || 'Предмет'}</div>
                  <div className="text-sm text-gray-600">{studentLabel(l.student)}</div>
                  <div className="text-sm">{fmtDate.format(new Date(l.startsAt))}</div>
                  <div className="text-sm">{lDuration(l)} мин · {fmtMoney.format(lPriceCents(l) / 100)}</div>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-2 rounded border" onClick={()=>markDone(l.id)}>Проведён</button>
                  <button className="px-3 py-2 rounded border" onClick={()=>cancelLesson(l.id)}>Отменить</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Проведённые */}
      <section className="rounded-xl border p-4">
        <div className="font-semibold mb-3">Проведённые</div>
        {doneList.length === 0 ? (
          <div className="text-sm text-gray-500">Пока пусто</div>
        ) : (
          <div className="space-y-2">
            {doneList.map(l => (
              <div key={l.id} className="rounded border px-3 py-2 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div className="space-y-1">
                  <div className="font-medium">{l.subjectName || subjects.find(s=>s.subjectId===l.subjectId)?.name || 'Предмет'}</div>
                  <div className="text-sm text-gray-600">{studentLabel(l.student)}</div>
                  <div className="text-sm">{fmtDate.format(new Date(l.startsAt))}</div>
                  <div className="text-sm">{lDuration(l)} мин · {fmtMoney.format(lPriceCents(l) / 100)}</div>
                </div>
                <div className="text-xs uppercase tracking-wide text-green-700 font-semibold">DONE</div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border p-4">
        <div className="font-semibold mb-3">Заявка на вывод</div>
        <div className="grid md:grid-cols-3 gap-3">
          <div className="md:col-span-1">
            <label className="text-sm block mb-1">Сумма (₽)</label>
            <input className="w-full rounded border px-3 py-2" value={withdrawAmount} onChange={(e)=>setWithdrawAmount(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm block mb-1">Комментарий</label>
            <input className="w-full rounded border px-3 py-2" value={withdrawNotes} onChange={(e)=>setWithdrawNotes(e.target.value)} />
          </div>
        </div>
        <div className="mt-3"><button className="px-3 py-2 rounded border" onClick={createWithdraw}>Отправить</button></div>
      </section>
    </div>
  );
}
