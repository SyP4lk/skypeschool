'use client';
import { useToast } from '@/shared/ui/Toast';
import { useEffect, useMemo, useState } from 'react';
import { api } from '../_lib/api';

type Subject = { id: string; name: string; price?: number; duration?: number };
type Student = { id: string; login: string; firstName?: string|null; lastName?: string|null; phone?: string|null; email?: string|null };

export default function CreateLessonForm() {
  const toast = useToast();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [q, setQ] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [duration, setDuration] = useState('');
  const [price, setPrice] = useState('');
  const [note, setNote] = useState('');
  const [msg, setMsg] = useState<string|null>(null);
  const [err, setErr] = useState<string|null>(null);

  useEffect(() => {
    (async () => {
      try {
        const subs = await api<Subject[]>('/teacher/me/subjects');
        setSubjects(subs || []);
      } catch (e:any) { /* ignore */ }
    })();
  }, []);

  useEffect(() => {
    const id = setTimeout(async () => {
      try {
        const list = await api<Student[]>(`/teacher/me/students?q=${encodeURIComponent(q)}`);
        setStudents(list || []);
      } catch (e:any) { /* ignore */ }
    }, 250);
    return () => clearTimeout(id);
  }, [q]);

  useEffect(() => {
    const s = subjects.find(s => s.id === subjectId);
    if (s) {
      if (s.duration && !duration) setDuration(String(s.duration));
      if (s.price && !price) setPrice(String(s.price));
    }
  }, [subjectId, subjects]);

  async function submit() {
    setMsg(null); setErr(null);
    try {
      if (!studentId) throw new Error('Выберите ученика');
      if (!subjectId) throw new Error('Выберите предмет');
      if (!startsAt) throw new Error('Укажите дату/время');
      const payload = {
        studentId,
        subjectId,
        startsAt: new Date(startsAt).toISOString(),
        durationMin: duration ? parseInt(duration, 10) : undefined,
        price: price ? parseInt(price, 10) : undefined,
        comment: note || undefined,
      };
      await api('/teacher/me/lessons', { method: 'POST', body: JSON.stringify(payload) });
      setMsg('Урок назначен');
      setStudentId(''); setSubjectId(''); setStartsAt(''); setDuration(''); setPrice(''); setNote('');
    } catch (e:any) {
      setErr(e?.message || 'Ошибка'); toast({ type:'error', message: e?.message || 'Ошибка' });
    }
  }

  return (
    <div className="rounded-xl border p-4">
      <div className="font-semibold mb-3">Назначить урок</div>
      <div className="grid md:grid-cols-3 gap-3">
        <div>
          <label className="text-sm block mb-1">Ученик</label>
          <input className="w-full rounded border px-3 py-2 mb-2" placeholder="Поиск..." value={q} onChange={e=>setQ(e.target.value)} />
          <select className="w-full rounded border px-3 py-2" value={studentId} onChange={e=>setStudentId(e.target.value)}>
            <option value="">— выберите —</option>
            {students.map(s => (
              <option key={s.id} value={s.id}>{s.login} {s.firstName || ''} {s.lastName || ''}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm block mb-1">Предмет</label>
          <select className="w-full rounded border px-3 py-2" value={subjectId} onChange={e=>setSubjectId(e.target.value)}>
            <option value="">— выберите —</option>
            {subjects.map(s => (<option key={s.id} value={s.id}>{s.name}</option>))}
          </select>
        </div>
        <div>
          <label className="text-sm block mb-1">Начало</label>
          <input type="datetime-local" className="w-full rounded border px-3 py-2" value={startsAt} onChange={e=>setStartsAt(e.target.value)} />
        </div>
        <div>
          <label className="text-sm block mb-1">Длительность (мин)</label>
          <input className="w-full rounded border px-3 py-2" value={duration} onChange={e=>setDuration(e.target.value)} />
        </div>
        <div>
          <label className="text-sm block mb-1">Цена (₽)</label>
          <input className="w-full rounded border px-3 py-2" value={price} onChange={e=>setPrice(e.target.value)} />
        </div>
        <div className="md:col-span-3">
          <label className="text-sm block mb-1">Комментарий</label>
          <input className="w-full rounded border px-3 py-2" value={note} onChange={e=>setNote(e.target.value)} />
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button className="px-3 py-2 rounded border" onClick={submit}>Создать</button>
        {msg && <span className="text-green-700 text-sm">{msg}</span>}
        {err && <span className="text-red-600 text-sm">{err}</span>}
      </div>
    </div>
  );
}
