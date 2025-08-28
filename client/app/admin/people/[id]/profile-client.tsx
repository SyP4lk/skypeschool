'use client';

import { useEffect, useState } from 'react';
import { api } from '../../_lib/api';
import Input from '@/components/ui/Input';
import { Card, CardTitle } from '@/components/ui/Card';
import Select from '@/components/ui/Select';
import { mediaUrl } from '@/lib/media';

type Role = 'student' | 'teacher';
type User = { id: string; login: string; firstName: string|null; lastName: string|null; role: 'student'|'teacher'|'admin'; balance: number };
type StudentProfile = {
  avatar?: string|null;
  contactSkype?: string|null; contactVk?: string|null; contactGoogle?: string|null;
  contactWhatsapp?: string|null; contactMax?: string|null; contactDiscord?: string|null;
};
type Subject = { id: string; name: string };

function validateImage(f: File | null, setError: (s: string)=>void) {
  if (!f) return null;
  const MAX = 5 * 1024 * 1024;
  const okTypes = ['image/jpeg','image/jpg','image/png'];
  const okExts = ['.jpg','.jpeg','.png'];
  const name = f.name.toLowerCase();
  const extOk = okExts.some(ext => name.endsWith(ext));
  const typeOk = okTypes.includes(f.type);
  if (!extOk || !typeOk) { setError('Только JPG/PNG до 5 МБ'); return null; }
  if (f.size > MAX) { setError('Файл больше 5 МБ'); return null; }
  return f;
}

export default function ProfileClient({ id, role }: { id: string; role: Role }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [firstName, setFirst] = useState(''); const [lastName, setLast] = useState('');
  const [pwd, setPwd] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // student contacts
  const [c, setC] = useState<StudentProfile>({});

  // TEACHER
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teacherProfileId, setTeacherProfileId] = useState<string>('');
  const [tAbout, setTAbout] = useState<string>('');
  const [tPhotoUrl, setTPhotoUrl] = useState<string | null>(null);
  const [tPhotoFile, setTPhotoFile] = useState<File | null>(null);
  const [tSubjectId, setTSubjectId] = useState<string>('');
  const [tDuration, setTDuration] = useState<string>('');
  const [tPrice, setTPrice] = useState<string>('');
  // teacher contacts
  const [tContactSkype, setTContactSkype] = useState('');
  const [tContactVk, setTContactVk] = useState('');
  const [tContactGoogle, setTContactGoogle] = useState('');
  const [tContactWhatsapp, setTContactWhatsapp] = useState('');
  const [tContactMax, setTContactMax] = useState('');
  const [tContactDiscord, setTContactDiscord] = useState('');

  async function load() {
    setErr(null); setMsg(null);
    try {
      if (role === 'student') {
        const r = await api(`/admin/students/${id}`);
        setUser(r.user); setProfile(r.profile || null);
        setFirst(r.user.firstName || ''); setLast(r.user.lastName || '');
        setC({
          contactSkype: r.profile?.contactSkype || '',
          contactVk: r.profile?.contactVk || '',
          contactGoogle: r.profile?.contactGoogle || '',
          contactWhatsapp: r.profile?.contactWhatsapp || '',
          contactMax: r.profile?.contactMax || '',
          contactDiscord: r.profile?.contactDiscord || '',
        });
      } else {
        const u = await api(`/admin/users/${id}`);
        setUser(u.user);
        setFirst(u.user.firstName || ''); setLast(u.user.lastName || '');

        const list = await api<any[]>('/admin/teachers');
        const me = (Array.isArray(list) ? list : []).find((t) => t?.user?.id === id);
        if (!me) throw new Error('Профиль преподавателя не найден');
        setTeacherProfileId(me.id);

        const d = await api(`/admin/teachers/${me.id}`);
        setTAbout(d?.aboutShort || '');
        setTPhotoUrl(d?.photo || null);
        const ts = Array.isArray(d?.teacherSubjects) ? d.teacherSubjects : [];
        if (ts[0]) {
          setTSubjectId(ts[0].subjectId || '');
          setTDuration(String(ts[0].duration || ''));
          setTPrice(String(ts[0].price || ''));
        } else {
          setTSubjectId(''); setTDuration(''); setTPrice('');
        }
        // contacts (если бэк вернёт — подставим, иначе пусто)
        setTContactSkype(d?.contactSkype || '');
        setTContactVk(d?.contactVk || '');
        setTContactGoogle(d?.contactGoogle || '');
        setTContactWhatsapp(d?.contactWhatsapp || '');
        setTContactMax(d?.contactMax || '');
        setTContactDiscord(d?.contactDiscord || '');

        const subs = await api('/subjects');
        setSubjects(Array.isArray(subs) ? subs : subs.items || []);
      }
    } catch (e: any) {
      setErr(e?.message || String(e));
    }
  }

  useEffect(() => { load(); }, [id, role]);

  async function saveNames() {
    try {
      if (role === 'student') {
        await api(`/admin/students/${id}`, {
          method: 'PATCH', body: JSON.stringify({ firstName, lastName, ...c }),
        });
      } else {
        await api(`/admin/users/${id}`, {
          method: 'PATCH', body: JSON.stringify({ firstName, lastName }),
        });
      }
      setMsg('Сохранено');
      await load();
    } catch (e: any) {
      setErr(e?.message || String(e));
    }
  }

  async function setPassword() {
    try {
      if (!pwd || pwd.length < 8) throw new Error('Пароль минимум 8 символов');
      if (role === 'student') {
        const r = await api(`/admin/students/${id}/password`, { method: 'POST', body: JSON.stringify({ newPassword: pwd }) });
        setMsg(`Пароль задан: ${r.newPassword}`);
      } else {
        await api(`/admin/users/${id}/password`, { method: 'POST', body: JSON.stringify({ newPassword: pwd }) });
        setMsg('Пароль обновлён');
      }
      setPwd('');
    } catch (e: any) {
      setErr(e?.message || String(e));
    }
  }

  async function saveTeacherProfile() {
    try {
      if (!teacherProfileId) throw new Error('Не найден ID профиля преподавателя');
      const priceNum = Math.round(Number(tPrice));
      const durationNum = parseInt(tDuration, 10);
      if (!tSubjectId) throw new Error('Выберите предмет');
      if (!Number.isFinite(priceNum) || priceNum <= 0) throw new Error('Цена должна быть положительным числом');
      if (!Number.isFinite(durationNum) || durationNum <= 0) throw new Error('Длительность должна быть положительным числом (мин)');

      const fd = new FormData();
      if (firstName) fd.append('firstName', firstName);
      if (lastName) fd.append('lastName', lastName);
      if (tAbout) fd.append('aboutShort', tAbout);
      if (tPhotoFile) {
        const ok = validateImage(tPhotoFile, setErr);
        if (!ok) throw new Error('Только JPG/PNG до 5 МБ');
        fd.append('photo', ok);
      }

      // контакты преподавателя — отправляем строками (бэк начнёт сохранять после расширения DTO/схемы)
      if (tContactSkype) fd.append('contactSkype', tContactSkype);
      if (tContactVk) fd.append('contactVk', tContactVk);
      if (tContactGoogle) fd.append('contactGoogle', tContactGoogle);
      if (tContactWhatsapp) fd.append('contactWhatsapp', tContactWhatsapp);
      if (tContactMax) fd.append('contactMax', tContactMax);
      if (tContactDiscord) fd.append('contactDiscord', tContactDiscord);

      fd.append('teacherSubjects', JSON.stringify([{ subjectId: tSubjectId, price: priceNum, duration: durationNum }]));

      const base = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api').replace(/\/+$/, '');
      const res = await fetch(`${base}/admin/teachers/${teacherProfileId}`, { method: 'PUT', body: fd, credentials: 'include' });
      const raw = await res.text();
      if (!res.ok) {
        try { const j = JSON.parse(raw); throw new Error(j?.message || raw || res.statusText); }
        catch { throw new Error(raw || res.statusText); }
      }

      setMsg('Профиль преподавателя сохранён');
      setTPhotoFile(null);
      await load();
    } catch (e: any) {
      setErr(e?.message || String(e));
    }
  }

  async function uploadAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = validateImage(e.target.files?.[0] || null, setErr);
    if (!file) { e.currentTarget.value = ''; return; }
    const fd = new FormData(); fd.append('file', file);
    try {
      await api(`/admin/students/${id}/avatar`, { method: 'POST', body: fd });
      setMsg('Аватар обновлён'); await load();
    } catch (e: any) { setErr(e?.message || String(e)); }
    finally { e.currentTarget.value = ''; }
  }

  if (!user) return <div className="text-gray-500">Загрузка…</div>;

  return (
    <div className="grid gap-6">
      <Card>
        <CardTitle>Профиль пользователя</CardTitle>

        <div className="grid md:grid-cols-2 gap-4">
          <div><label className="text-sm block">Имя</label><Input value={firstName} onChange={e=>setFirst(e.target.value)} /></div>
          <div><label className="text-sm block">Фамилия</label><Input value={lastName} onChange={e=>setLast(e.target.value)} /></div>
          <div><label className="text-sm block">Логин</label><div className="p-2 border rounded bg-gray-50">{user.login}</div></div>
          <div><label className="text-sm block">Роль</label><div className="p-2 border rounded bg-gray-50">{user.role}</div></div>
          <div><label className="text-sm block">Баланс</label><div className="p-2 border rounded bg-gray-50">{(user.balance/100).toFixed(2)} ₽</div></div>
        </div>

        {role === 'student' && (
          <>
            <div className="mt-6 grid md:grid-cols-2 gap-4">
              <div><label className="text-sm block">Skype</label><Input value={c.contactSkype || ''} onChange={e=>setC({ ...c, contactSkype: e.target.value })} /></div>
              <div><label className="text-sm block">VK</label><Input value={c.contactVk || ''} onChange={e=>setC({ ...c, contactVk: e.target.value })} /></div>
              <div><label className="text-sm block">Google Meet</label><Input value={c.contactGoogle || ''} onChange={e=>setC({ ...c, contactGoogle: e.target.value })} /></div>
              <div><label className="text-sm block">WhatsApp</label><Input value={c.contactWhatsapp || ''} onChange={e=>setC({ ...c, contactWhatsapp: e.target.value })} /></div>
              <div><label className="text-sm block">MAX</label><Input value={c.contactMax || ''} onChange={e=>setC({ ...c, contactMax: e.target.value })} /></div>
              <div><label className="text-sm block">Discord</label><Input value={c.contactDiscord || ''} onChange={e=>setC({ ...c, contactDiscord: e.target.value })} /></div>
            </div>

            <div className="mt-6">
              <label className="text-sm block mb-1">Аватар</label>
              <div className="flex items-center gap-4">
                <img src={profile?.avatar ? mediaUrl(profile.avatar) : '/avatar-placeholder.png'} alt="avatar" className="w-16 h-16 rounded-full object-cover border" />
                <input type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png" onChange={uploadAvatar} />
              </div>
            </div>
          </>
        )}

        {role === 'teacher' && (
          <>
            <div className="mt-6 grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-sm block mb-1">Краткое описание</label>
                <textarea value={tAbout} onChange={(e) => setTAbout(e.target.value)} className="w-full min-h-[90px] rounded border px-3 py-2" placeholder="Пара предложений о преподавателе" />
              </div>

              <div>
                <label className="text-sm block mb-1">Фото</label>
                <div className="flex items-center gap-4">
                  <img src={tPhotoUrl ? mediaUrl(tPhotoUrl) : '/avatar-placeholder.png'} alt="teacher" className="w-16 h-16 rounded object-cover border" />
                  <input type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png" onChange={(e) => {
                    const ok = validateImage(e.target.files?.[0] || null, setErr);
                    setTPhotoFile(ok || null);
                  }} />
                </div>
                <p className="text-xs text-gray-500 mt-1">Новый файл прикрепляйте при необходимости замены.</p>
              </div>

              <div>
                <label className="text-sm block mb-1">Предмет</label>
                <Select value={tSubjectId} onChange={(e) => setTSubjectId(e.target.value)}>
                  <option value="">— выбрать —</option>
                  {subjects.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
                </Select>
              </div>
              <div><label className="text-sm block mb-1">Длительность, мин</label><Input type="number" min={1} value={tDuration} onChange={(e) => setTDuration(e.target.value)} placeholder="Напр. 60" /></div>
              <div><label className="text-sm block mb-1">Цена, ₽</label><Input type="number" min={1} value={tPrice} onChange={(e) => setTPrice(e.target.value)} placeholder="Напр. 1500" /></div>
            </div>

            {/* Контакты преподавателя */}
            <div className="mt-6 grid md:grid-cols-2 gap-4">
              <div><label className="text-sm block">Skype</label><Input value={tContactSkype} onChange={(e) => setTContactSkype(e.target.value)} /></div>
              <div><label className="text-sm block">VK</label><Input value={tContactVk} onChange={(e) => setTContactVk(e.target.value)} /></div>
              <div><label className="text-sm block">Google Meet</label><Input value={tContactGoogle} onChange={(e) => setTContactGoogle(e.target.value)} /></div>
              <div><label className="text-sm block">WhatsApp</label><Input value={tContactWhatsapp} onChange={(e) => setTContactWhatsapp(e.target.value)} /></div>
              <div><label className="text-sm block">MAX</label><Input value={tContactMax} onChange={(e) => setTContactMax(e.target.value)} /></div>
              <div><label className="text-sm block">Discord</label><Input value={tContactDiscord} onChange={(e) => setTContactDiscord(e.target.value)} /></div>
            </div>

            <div className="mt-4">
              <button className="px-3 py-2 rounded bg-black text-white" onClick={saveTeacherProfile}>
                Сохранить профиль преподавателя
              </button>
            </div>
          </>
        )}

        <div className="mt-6 flex items-center gap-3">
          <button className="px-3 py-2 rounded bg-black text-white" onClick={saveNames}>Сохранить</button>
          {msg && <span className="text-green-700 text-sm">{msg}</span>}
          {err && <span className="text-red-600 text-sm">{err}</span>}
        </div>
      </Card>

      <Card>
        <CardTitle>Задать пароль</CardTitle>
        <div className="flex items-center gap-3">
          <Input placeholder="мин. 8 символов" value={pwd} onChange={e=>setPwd(e.target.value)} />
          <button className="px-3 py-2 rounded bg-black text-white" onClick={setPassword}>Обновить</button>
        </div>
        <p className="text-xs text-gray-500 mt-2">Пароль не показываем — только задаём новый.</p>
      </Card>
    </div>
  );
}
