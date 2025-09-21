'use client';

import { useEffect, useState } from 'react';

const API_BASE = '';
async function api<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}/api${path}`, {
    credentials: 'include',
    cache: 'no-store',
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init.body && !(init.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      ...(init.headers || {}),
    },
  });
  const text = await res.text().catch(() => '');
  if (!res.ok) {
    try { throw new Error(JSON.parse(text)?.message || res.statusText); }
    catch { throw new Error(text || res.statusText); }
  }
  try { return JSON.parse(text) as T; } catch { return text as unknown as T; }
}

type Role = 'student' | 'teacher';
type User = {
  id: string; login: string; role: 'student'|'teacher'|'admin';
  firstName: string|null; lastName: string|null; phone?: string|null; email?: string|null;
};

type StudentProfile = {
  contactSkype?: string|null; contactVk?: string|null; contactGoogle?: string|null;
  contactWhatsapp?: string|null; contactMax?: string|null; contactDiscord?: string|null;
  // возможный вариант поля в БД
  contactWhatsApp?: string|null;
  avatar?: string|null;
};
type Subject = { id: string; name: string };

export default function ProfileClient({ id, role }: { id: string; role: Role }) {
  const [user, setUser] = useState<User | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const [firstName, setFirst] = useState(''); const [lastName, setLast] = useState('');
  const [phone, setPhone] = useState(''); const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');

  // student
  const [profile, setProfile] = useState<StudentProfile | null>(null);

  // teacher
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teacherProfileId, setTeacherProfileId] = useState<string>(''); // ⬅ сюда кладём userId (fallback на id)
  const [about, setAbout] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null); // заглушка
  const [subjId, setSubjId] = useState('');
  const [duration, setDuration] = useState('');
  const [priceRub, setPriceRub] = useState(''); // РУБЛИ!
  // контакты преподавателя
  const [tContacts, setTContacts] = useState({
    contactVk: '', contactTelegram: '', contactWhatsapp: '',
    contactZoom: '', contactTeams: '', contactDiscord: '', contactMax: '',
  });

  async function load() {
    setErr(null); setMsg(null);
    try {
      if (role === 'student') {
        const r = await api<{ user: User; profile?: StudentProfile }>(`/admin/students/${id}`);
        setUser(r.user); setFirst(r.user.firstName || ''); setLast(r.user.lastName || '');
        setPhone(r.user.phone || ''); setEmail(r.user.email || '');
        // нормализуем возможные варианты имён полей
        const p = r.profile || {};
        setProfile({
          contactSkype: p?.contactSkype ?? '',
          contactVk: p?.contactVk ?? '',
          contactGoogle: p?.contactGoogle ?? '',
          contactWhatsapp: (p as any)?.contactWhatsapp ?? (p as any)?.contactWhatsApp ?? '',
          contactMax: p?.contactMax ?? '',
          contactDiscord: p?.contactDiscord ?? '',
          avatar: (p as any)?.avatar ?? null,
        });
      } else {
        const u = await api<{ user: User }>(`/admin/users/${id}`);
        setUser(u.user); setFirst(u.user.firstName || ''); setLast(u.user.lastName || '');
        setPhone(u.user.phone || ''); setEmail(u.user.email || '');

        // список «преподавателей»
        const list = await api<any[]>(`/admin/teachers`);
        const me = (Array.isArray(list) ? list : []).find(t => t?.user?.id === id || t?.userId === id);
        if (!me) throw new Error('Профиль преподавателя не найден');

        // ⬇ КЛЮЧ ДЛЯ /admin/teachers/:id — userId, иначе id (устраняет 404 teacher_not_found)
        const teacherKey: string = me.userId || me.id;
        setTeacherProfileId(teacherKey);

        const d = await api<any>(`/admin/teachers/${teacherKey}`);
        setAbout(d?.aboutShort || '');
        const ts = Array.isArray(d?.teacherSubjects) ? d.teacherSubjects : [];
        if (ts[0]) {
          setSubjId(ts[0].subjectId || '');
          setDuration(String(ts[0].duration || ''));
          setPriceRub(String(ts[0].price || ''));
        } else { setSubjId(''); setDuration(''); setPriceRub(''); }

        setTContacts({
          contactVk: d?.contactVk || '',
          contactTelegram: d?.contactTelegram || '',
          contactWhatsapp: d?.contactWhatsapp || '',
          contactZoom: d?.contactZoom || '',
          contactTeams: d?.contactTeams || '',
          contactDiscord: d?.contactDiscord || '',
          contactMax: d?.contactMax || '',
        });

        const subs = await api<Subject[] | { items: Subject[] }>(`/subjects`);
        setSubjects(Array.isArray(subs) ? subs : (subs.items ?? []));
      }
    } catch (e: any) {
      setErr(e?.message || String(e));
    }
  }
  useEffect(() => { void load(); }, [id, role]);

  async function saveGeneral() {
    try {
      await api(`/admin/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ firstName, lastName, phone: phone || null, email: email || null }),
      });
      setMsg('Сохранено'); await load();
    } catch (e: any) { setErr(e?.message || String(e)); }
  }

  async function setPassword() {
    try {
      if (!pwd || pwd.length < 8) throw new Error('Пароль минимум 8 символов');
      if (role === 'student') {
        await api(`/admin/students/${id}/password`, { method: 'POST', body: JSON.stringify({ newPassword: pwd }) });
      } else {
        await api(`/admin/users/${id}/password`, { method: 'POST', body: JSON.stringify({ password: pwd }) });
      }
      setMsg('Пароль сохранён'); setPwd('');
    } catch (e: any) { setErr(e?.message || String(e)); }
  }

  async function saveStudent() {
    setErr(null); setMsg(null);
    try {
      // 1) пользовательские поля
      await api(`/admin/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          firstName: (firstName || '').trim(),
          lastName:  (lastName  || '').trim(),
          phone: phone || null,
          email: email || null,
        }),
      });

      // 2) контакты профиля (дублируем ключи для совместимости со схемой)
      const p: any = profile || {};
      const contacts = {
        contactSkype: p.contactSkype || null,
        contactVk: p.contactVk || null,
        contactGoogle: p.contactGoogle || null,
        contactWhatsapp: p.contactWhatsapp ?? p.contactWhatsApp ?? null,
        contactWhatsApp: p.contactWhatsApp ?? p.contactWhatsapp ?? null,
        contactMax: p.contactMax || null,
        contactDiscord: p.contactDiscord || null,
      };
      await api(`/admin/students/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(contacts),
      });

      setMsg('Сохранено');
      await load();
    } catch (e: any) {
      setErr(e?.message || String(e));
    }
  }

  async function saveTeacher() {
    if (!teacherProfileId) return;
    try {
      // ⬇ Формируем JSON вместо FormData (загрузка фото отключена)
      const durationNum = parseInt(duration, 10);
      const priceNum = parseInt((priceRub || '0').replace(',', '.'));
      const list = (subjId && durationNum && priceNum)
        ? [{ subjectId: subjId, duration: durationNum, price: priceNum }]
        : [];

      const payload = {
        aboutShort: about || '',
        teacherSubjects: list,
        // контакты можно оставить — бэкенд лишнее проигнорирует, пригодится на будущее
        ...tContacts,
      };

      await api(`/admin/teachers/${teacherProfileId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      // телефон/e-mail сохраняем на user
      await api(`/admin/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ phone: phone || null, email: email || null }),
      });

      setMsg('Сохранено');
      await load();
    } catch (e: any) { setErr(e?.message || String(e)); }
  }

  if (!user) return <div className="text-gray-500">Загрузка…</div>;

  return (
    <div className="grid gap-6">
      <section className="rounded-xl border p-4">
        <div className="font-semibold mb-3">Профиль</div>
        <div className="grid md:grid-cols-2 gap-3">
          <div><label className="text-sm block mb-1">Имя</label><input className="w-full rounded border px-3 py-2" value={firstName} onChange={e=>setFirst(e.target.value)} /></div>
          <div><label className="text-sm block mb-1">Фамилия</label><input className="w-full rounded border px-3 py-2" value={lastName} onChange={e=>setLast(e.target.value)} /></div>
          <div><label className="text-sm block mb-1">Телефон</label><input className="w-full rounded border px-3 py-2" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+7..." /></div>
          <div><label className="text-sm block mb-1">E-mail</label><input className="w-full rounded border px-3 py-2" value={email} onChange={e=>setEmail(e.target.value)} placeholder="name@example.com" /></div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            className="px-3 py-2 rounded border"
            onClick={role === 'student' ? saveStudent : saveGeneral}
          >
            Сохранить
          </button>
          <input className="rounded border px-3 py-2" placeholder="новый пароль" value={pwd} onChange={e=>setPwd(e.target.value)} />
          <button className="px-3 py-2 rounded border" onClick={setPassword}>Задать пароль</button>
          {msg && <span className="text-green-700 text-sm">{msg}</span>}
          {err && <span className="text-red-600 text-sm">{err}</span>}
        </div>
      </section>

      {role === 'teacher' ? (
        <section className="rounded-xl border p-4">
          <div className="font-semibold mb-3">Данные преподавателя</div>
          <div className="grid md:grid-cols-3 gap-3">
            <div className="md:col-span-3">
              <label className="text-sm block mb-1">Короткое описание</label>
              <input className="w-full rounded border px-3 py-2" value={about} onChange={e=>setAbout(e.target.value)} />
            </div>
            <div>
              <label className="text-sm block mb-1">Фото</label>
              {/* ⬇ заглушка */}
              <input type="file" accept="image/*" disabled className="opacity-50 cursor-not-allowed" onChange={e=>setPhotoFile(e.currentTarget.files?.[0] || null)} />
              <p className="text-xs text-gray-500 mt-1">Загрузка фото временно отключена</p>
            </div>
            <div>
              <label className="text-sm block mb-1">Предмет</label>
              <select className="w-full rounded border px-3 py-2" value={subjId} onChange={e=>setSubjId(e.target.value)}>
                <option value="">— выберите —</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div><label className="text-sm block mb-1">Длительность (мин)</label><input className="w-full rounded border px-3 py-2" value={duration} onChange={e=>setDuration(e.target.value)} /></div>
            <div><label className="text-sm block mb-1">Цена (₽)</label><input className="w-full rounded border px-3 py-2" value={priceRub} onChange={e=>setPriceRub(e.target.value)} /></div>

            {/* Контакты преподавателя */}
            <div><label className="text-sm block mb-1">VK</label><input className="w-full rounded border px-3 py-2" value={tContacts.contactVk} onChange={e=>setTContacts({...tContacts, contactVk:e.target.value})} /></div>
            <div><label className="text-sm block mb-1">Telegram</label><input className="w-full rounded border px-3 py-2" value={tContacts.contactTelegram} onChange={e=>setTContacts({...tContacts, contactTelegram:e.target.value})} /></div>
            <div><label className="text-sm block mb-1">WhatsApp</label><input className="w-full rounded border px-3 py-2" value={tContacts.contactWhatsapp} onChange={e=>setTContacts({...tContacts, contactWhatsapp:e.target.value})} /></div>
            <div><label className="text-sm block mb-1">Zoom</label><input className="w-full rounded border px-3 py-2" value={tContacts.contactZoom} onChange={e=>setTContacts({...tContacts, contactZoom:e.target.value})} /></div>
            <div><label className="text-sm block mb-1">Microsoft Teams</label><input className="w-full rounded border px-3 py-2" value={tContacts.contactTeams} onChange={e=>setTContacts({...tContacts, contactTeams:e.target.value})} /></div>
            <div><label className="text-sm block mb-1">Discord</label><input className="w-full rounded border px-3 py-2" value={tContacts.contactDiscord} onChange={e=>setTContacts({...tContacts, contactDiscord:e.target.value})} /></div>
            <div><label className="text-sm block mb-1">MAX</label><input className="w-full rounded border px-3 py-2" value={tContacts.contactMax} onChange={e=>setTContacts({...tContacts, contactMax:e.target.value})} /></div>
          </div>

          <div className="mt-3"><button className="px-3 py-2 rounded border" onClick={saveTeacher}>Сохранить</button></div>
        </section>
      ) : (
        <section className="rounded-xl border p-4">
          <div className="font-semibold mb-3">Контакты ученика</div>
          <div className="grid md:grid-cols-3 gap-3">
            {['contactSkype','contactVk','contactGoogle','contactWhatsapp','contactMax','contactDiscord'].map((key) => (
              <div key={key}>
                <label className="text-sm block mb-1">{key.replace('contact','')}</label>
                <input
                  className="w-full rounded border px-3 py-2"
                  value={(profile as any)?.[key] || ''}
                  onChange={(e)=>setProfile(prev=>({...(prev||{}), [key]: e.target.value}))}
                />
              </div>
            ))}
          </div>
          {/* Кнопки не дублируем — сохраняем верхней кнопкой */}
        </section>
      )}
    </div>
  );
}
