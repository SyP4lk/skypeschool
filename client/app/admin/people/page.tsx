'use client';

import { useEffect, useState } from 'react';
import { api } from '../_lib/api';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { Card, CardTitle } from '@/components/ui/Card';
import Link from 'next/link';

type Item = {
  id: string;
  login: string;
  firstName: string | null;
  lastName: string | null;
  role: 'admin' | 'teacher' | 'student';
  balance: number;
};

type Subject = { id: string; name: string };

function validateImage(f: File | null, setError: (s: string) => void) {
  if (!f) return null;
  const MAX = 5 * 1024 * 1024;
  const okTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  const okExts = ['.jpg', '.jpeg', '.png'];
  const name = f.name.toLowerCase();
  const extOk = okExts.some((ext) => name.endsWith(ext));
  const typeOk = okTypes.includes(f.type);
  if (!extOk || !typeOk) { setError('Только JPG/PNG до 5 МБ'); return null; }
  if (f.size > MAX) { setError('Файл больше 5 МБ'); return null; }
  return f;
}

export default function PeoplePage() {
  // список
  const [role, setRole] = useState<'all' | 'student' | 'teacher'>('all');
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // создание — общее
  const [cRole, setCRole] = useState<'student' | 'teacher'>('student');
  const [cLogin, setCLogin] = useState('');
  const [cPassword, setCPassword] = useState('');
  const [cFirst, setCFirst] = useState('');
  const [cLast, setCLast] = useState('');
  const [cMsg, setCMsg] = useState<string | null>(null);
  const [cErr, setCErr] = useState<string | null>(null);

  // создание — контакты (для обеих ролей)
  const [cContactSkype, setCContactSkype] = useState('');
  const [cContactVk, setCContactVk] = useState('');
  const [cContactGoogle, setCContactGoogle] = useState('');
  const [cContactWhatsapp, setCContactWhatsapp] = useState('');
  const [cContactMax, setCContactMax] = useState('');
  const [cContactDiscord, setCContactDiscord] = useState('');

  // создание — преподаватель
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [cAbout, setCAbout] = useState('');
  const [cPhoto, setCPhoto] = useState<File | null>(null);
  const [cSubjectId, setCSubjectId] = useState('');
  const [cDuration, setCDuration] = useState('');
  const [cPrice, setCPrice] = useState('');

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const qs = new URLSearchParams({ query });
      if (role !== 'all') qs.set('role', role);
      const r = await api(`/admin/users?${qs.toString()}`);
      setItems(r.items || []);
      setTotal(r.total || 0);
    } catch (e: any) {
      setErr(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [role]);

  // подгрузка предметов при необходимости
  useEffect(() => {
    if (cRole !== 'teacher') return;
    let cancelled = false;
    (async () => {
      try {
        const r = await api('/subjects');
        if (!cancelled) setSubjects(Array.isArray(r) ? r : r.items || []);
      } catch {
        if (!cancelled) setSubjects([]);
      }
    })();
    return () => { cancelled = true; };
  }, [cRole]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    await load();
  }

  async function createUser() {
    setCMsg(null);
    setCErr(null);

    try {
      const login = cLogin.trim();
      if (!login) throw new Error('Укажи логин');

      // Пред-проверка занятости логина
      try {
        const qs = new URLSearchParams({ query: login });
        const search = await api<{ items: { login: string }[] }>(`/admin/users?${qs.toString()}`);
        const exact = (search.items || []).some((u) => u.login === login);
        if (exact) throw new Error('Логин уже занят');
      } catch {}

      if (cRole === 'student') {
        if (cPassword && cPassword.length < 8) throw new Error('Пароль минимум 8 символов');
        const body = {
          role: cRole,
          login,
          firstName: cFirst || undefined,
          lastName: cLast || undefined,
          password: cPassword || undefined,
        };
        const r = await api<any>('/admin/users', { method: 'POST', body: JSON.stringify(body) });
        setCMsg(`Создан ${r.user.login} (${r.user.role}). ${r.newPassword ? 'Пароль: ' + r.newPassword : ''}`);

        // если контакты заполнены — сразу сохраним профиль студента
        const anyContacts =
          cContactSkype || cContactVk || cContactGoogle || cContactWhatsapp || cContactMax || cContactDiscord;
        if (r?.user?.id && anyContacts) {
          await api(`/admin/students/${r.user.id}`, {
            method: 'PATCH',
            body: JSON.stringify({
              firstName: cFirst || undefined,
              lastName: cLast || undefined,
              contactSkype: cContactSkype || undefined,
              contactVk: cContactVk || undefined,
              contactGoogle: cContactGoogle || undefined,
              contactWhatsapp: cContactWhatsapp || undefined,
              contactMax: cContactMax || undefined,
              contactDiscord: cContactDiscord || undefined,
            }),
          });
        }
      } else {
        if (!cPassword || cPassword.length < 8) throw new Error('Для преподавателя пароль обязателен и не короче 8 символов');
        if (!cSubjectId) throw new Error('Выбери предмет');

        const priceNum = Math.round(Number(cPrice));
        const durationNum = parseInt(cDuration, 10);
        if (!Number.isFinite(priceNum) || priceNum <= 0) throw new Error('Цена должна быть положительным числом');
        if (!Number.isFinite(durationNum) || durationNum <= 0) throw new Error('Длительность должна быть положительным числом (мин)');

        const fd = new FormData();
        fd.append('login', login);
        fd.append('password', cPassword);
        if (cFirst) fd.append('firstName', cFirst);
        if (cLast) fd.append('lastName', cLast);
        if (cAbout) fd.append('aboutShort', cAbout);
        if (cPhoto) {
          const ok = validateImage(cPhoto, setCErr);
          if (!ok) throw new Error('Исправь файл и попробуй снова');
          fd.append('photo', ok);
        }
        // контакты преподавателя — отправим как простые строки (бэк примет после расширения DTO)
        if (cContactSkype) fd.append('contactSkype', cContactSkype);
        if (cContactVk) fd.append('contactVk', cContactVk);
        if (cContactGoogle) fd.append('contactGoogle', cContactGoogle);
        if (cContactWhatsapp) fd.append('contactWhatsapp', cContactWhatsapp);
        if (cContactMax) fd.append('contactMax', cContactMax);
        if (cContactDiscord) fd.append('contactDiscord', cContactDiscord);

        fd.append('teacherSubjects', JSON.stringify([{ subjectId: cSubjectId, price: priceNum, duration: durationNum }]));

        const base = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api').replace(/\/+$/, '');
        const res = await fetch(`${base}/admin/teachers`, { method: 'POST', body: fd, credentials: 'include' });
        const raw = await res.text();
        if (!res.ok) {
          try { const j = JSON.parse(raw); throw new Error(j?.message || raw || res.statusText); }
          catch { throw new Error(raw || res.statusText); }
        }

        setCMsg(`Создан преподаватель ${login}.`);
      }

      // сброс полей
      setCLogin(''); setCPassword(''); setCFirst(''); setCLast('');
      setCAbout(''); setCPhoto(null); setCSubjectId(''); setCDuration(''); setCPrice('');
      setCContactSkype(''); setCContactVk(''); setCContactGoogle(''); setCContactWhatsapp(''); setCContactMax(''); setCContactDiscord('');

      await load();
    } catch (e: any) {
      setCErr(e?.message || String(e));
    }
  }

  const isTeacher = cRole === 'teacher';

  return (
    <div className="grid gap-6">
      <Card>
        <CardTitle>Пользователи</CardTitle>

        <form onSubmit={handleSearch} className="flex items-center gap-3">
          <Select value={role} onChange={(e) => setRole(e.target.value as any)}>
            <option value="all">Все</option>
            <option value="student">Ученики</option>
            <option value="teacher">Преподаватели</option>
          </Select>

          <Input placeholder="Поиск по логину/имени/фамилии" value={query} onChange={(e) => setQuery(e.target.value)} />
          <button type="submit" className="px-4 py-2 rounded bg-black text-white">Найти</button>

          <span className="text-sm text-gray-500"> {total} всего</span>
          {err && <span className="text-sm text-red-600 ml-2">{err}</span>}
        </form>

        <table className="w-full mt-3 border-collapse">
          <thead>
            <tr className="text-left text-sm text-gray-500">
              <th className="py-2 px-4">ФИО</th>
              <th className="py-2 px-4">Логин</th>
              <th className="py-2 px-4">Роль</th>
              <th className="py-2 px-4">Баланс</th>
              <th className="py-2 px-4"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="py-2 px-4">{[u.lastName, u.firstName].filter(Boolean).join(' ') || '-'}</td>
                <td className="py-2 px-4">{u.login}</td>
                <td className="py-2 px-4">{u.role}</td>
                <td className="py-2 px-4">{(u.balance / 100).toFixed(2)} ₽</td>
                <td className="py-2 px-4">
                  <Link className="text-blue-600 hover:underline" href={`/admin/people/${u.id}?role=${u.role === 'teacher' ? 'teacher' : 'student'}`}>
                    Открыть
                  </Link>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td className="py-4 px-4 text-gray-500" colSpan={5}>{loading ? 'Загрузка…' : 'Список пуст'}</td></tr>
            )}
          </tbody>
        </table>
      </Card>

      <Card>
        <CardTitle>Создать пользователя</CardTitle>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
          <div>
            <label className="text-sm block mb-1">Роль</label>
            <Select value={cRole} onChange={(e) => setCRole(e.target.value as any)}>
              <option value="student">Ученик</option>
              <option value="teacher">Преподаватель</option>
            </Select>
          </div>
          <div>
            <label className="text-sm block mb-1">Логин</label>
            <Input value={cLogin} onChange={(e) => setCLogin(e.target.value)} placeholder="логин" />
          </div>
          <div>
            <label className="text-sm block mb-1">Пароль {isTeacher ? '(обязателен)' : '(необязательно)'}</label>
            <Input value={cPassword} onChange={(e) => setCPassword(e.target.value)} placeholder="мин. 8 символов" />
          </div>
          <div>
            <label className="text-sm block mb-1">Имя</label>
            <Input value={cFirst} onChange={(e) => setCFirst(e.target.value)} placeholder="Имя" />
          </div>
          <div>
            <label className="text-sm block mb-1">Фамилия</label>
            <Input value={cLast} onChange={(e) => setCLast(e.target.value)} placeholder="Фамилия" />
          </div>

          {isTeacher && (
            <>
              <div className="md:col-span-3">
                <label className="text-sm block mb-1">Краткое описание</label>
                <textarea value={cAbout} onChange={(e) => setCAbout(e.target.value)} className="w-full min-h-[90px] rounded border px-3 py-2" placeholder="Пара предложений о преподавателе" />
              </div>
              <div>
                <label className="text-sm block mb-1">Фото</label>
                <input type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png" onChange={(e) => setCPhoto(validateImage(e.target.files?.[0] || null, setCErr))} />
              </div>
              <div>
                <label className="text-sm block mb-1">Предмет</label>
                <Select value={cSubjectId} onChange={(e) => setCSubjectId(e.target.value)}>
                  <option value="">— выбрать —</option>
                  {subjects.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
                </Select>
              </div>
              <div>
                <label className="text-sm block mb-1">Длительность, мин</label>
                <Input type="number" min={1} value={cDuration} onChange={(e) => setCDuration(e.target.value)} placeholder="Напр. 60" />
              </div>
              <div>
                <label className="text-sm block mb-1">Цена, ₽</label>
                <Input type="number" min={1} value={cPrice} onChange={(e) => setCPrice(e.target.value)} placeholder="Напр. 1500" />
              </div>
            </>
          )}
        </div>

        {/* Контакты — для обеих ролей */}
        <div className="mt-4 grid sm:grid-cols-2 md:grid-cols-3 gap-3">
          <div><label className="text-sm block mb-1">Skype</label><Input value={cContactSkype} onChange={(e) => setCContactSkype(e.target.value)} /></div>
          <div><label className="text-sm block mb-1">VK</label><Input value={cContactVk} onChange={(e) => setCContactVk(e.target.value)} /></div>
          <div><label className="text-sm block mb-1">Google Meet</label><Input value={cContactGoogle} onChange={(e) => setCContactGoogle(e.target.value)} /></div>
          <div><label className="text-sm block mb-1">WhatsApp</label><Input value={cContactWhatsapp} onChange={(e) => setCContactWhatsapp(e.target.value)} /></div>
          <div><label className="text-sm block mb-1">MAX</label><Input value={cContactMax} onChange={(e) => setCContactMax(e.target.value)} /></div>
          <div><label className="text-sm block mb-1">Discord</label><Input value={cContactDiscord} onChange={(e) => setCContactDiscord(e.target.value)} /></div>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <button className="px-3 py-2 bg-gray-800 text-white rounded" onClick={createUser} type="button">Создать</button>
          {cMsg && <span className="text-green-700 text-sm">{cMsg}</span>}
          {cErr && <span className="text-red-600 text-sm">{cErr}</span>}
        </div>
      </Card>
    </div>
  );
}
