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
  contactWhatsApp?: string|null;
  avatar?: string|null;
};
type Subject = { id: string; name: string };

/* ===== upload helpers (те же, что и на странице создания) ===== */
async function uploadTeacherPhotoFile(teacherId: string, file: File): Promise<{ url: string }> {
  const fd = new FormData();
  fd.append('file', file);
  const r = await fetch(`/api/admin/teachers/${encodeURIComponent(teacherId)}/photo`, {
    method: 'POST',
    body: fd,
    credentials: 'include',
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j?.url) throw new Error(j?.message || 'upload failed');
  return { url: String(j.url) };
}
async function patchTeacherPhoto(id: string, url: string) {
  const r = await fetch(`/api/admin/teachers/${encodeURIComponent(id)}/photo`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ url }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j?.message || 'Не удалось сохранить фото');
  return j;
}
/* =============================================================== */

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
  const [teacherProfileId, setTeacherProfileId] = useState<string>(''); // userId или id
  const [about, setAbout] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [subjId, setSubjId] = useState('');
  const [duration, setDuration] = useState('');
  const [priceRub, setPriceRub] = useState('');             // ₽ — для преподавателя
  const [publicPriceRub, setPublicPriceRub] = useState(''); // ₽ — публичная

  const [tContacts, setTContacts] = useState({
    contactVk: '', contactTelegram: '', contactWhatsapp: '',
    contactZoom: '', contactTeams: '', contactDiscord: '', contactMax: '',
  });

  function onEditPhotoChange(file: File | null) {
    setPhotoFile(file);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(file ? URL.createObjectURL(file) : null);
  }

  async function upsertPricing(teacherId: string, subjectId: string, teacherPriceKop?: number, publicPriceKop?: number) {
    const payload: any = { teacherId, subjectId };
    if (Number.isFinite(teacherPriceKop) && teacherPriceKop! > 0) payload.teacherPrice = teacherPriceKop;
    if (Number.isFinite(publicPriceKop) && publicPriceKop! > 0) payload.publicPrice = publicPriceKop;

    async function tryCall(path: string, method: 'PUT'|'POST' = 'PUT') {
      try {
        await api(path, { method, body: JSON.stringify(payload) });
        return true;
      } catch (e: any) {
        const m = String(e?.message || '');
        if (m.includes('Not Found') || m.includes('404')) return false;
        throw e;
      }
    }
    if (await tryCall('/admin/pricing', 'PUT')) return;
    if (await tryCall('/pricing/admin/upsert', 'POST')) return;
  }

  async function load() {
    setErr(null); setMsg(null);
    try {
      if (role === 'student') {
        const r = await api<{ user: User; profile?: StudentProfile }>(`/admin/students/${id}`);
        setUser(r.user); setFirst(r.user.firstName || ''); setLast(r.user.lastName || '');
        setPhone(r.user.phone || ''); setEmail(r.user.email || '');
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

        const list = await api<any[]>(`/admin/teachers`);
        const me = (Array.isArray(list) ? list : []).find(t => t?.user?.id === id || t?.userId === id);
        if (!me) throw new Error('Профиль преподавателя не найден');

        const teacherKey: string = me.userId || me.id;     // сюда будем PATCH-ить фото
        setTeacherProfileId(teacherKey);

        const d = await api<any>(`/admin/teachers/${teacherKey}`);
        setAbout(d?.aboutShort || '');
        setPhotoUrl(d?.photo ?? null);

        const ts = Array.isArray(d?.teacherSubjects) ? d.teacherSubjects : [];
        if (ts[0]) {
          setSubjId(ts[0].subjectId || '');
          setDuration(String(ts[0].duration || ''));
          setPriceRub(String(ts[0].price || ''));
        } else {
          setSubjId(''); setDuration(''); setPriceRub('');
        }

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

        // подгружаем публичную цену (если настроена)
        const subjectId = (subjId || ts[0]?.subjectId || '');
        if (teacherKey && subjectId) {
          try {
            const r = await api<{ item?: { publicPrice?: number } }>(
              `/pricing/resolve?teacherId=${encodeURIComponent(id)}&subjectId=${encodeURIComponent(subjectId)}`
            );
            const pub = Number(r?.item?.publicPrice || 0);
            if (pub > 0) setPublicPriceRub(String(pub / 100));
          } catch { /* ignore */ }
        }
      }
    } catch (e: any) {
      setErr(e?.message || String(e));
    }
  }
  useEffect(() => { void load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [id, role]);

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
      await api(`/admin/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          firstName: (firstName || '').trim(),
          lastName:  (lastName  || '').trim(),
          phone: phone || null,
          email: email || null,
        }),
      });

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
      const durationNum = parseInt(duration, 10);
      const priceNum = parseInt((priceRub || '0').replace(',', '.'));
      const list = (subjId && durationNum && priceNum)
        ? [{ subjectId: subjId, duration: durationNum, price: priceNum }]
        : [];

      const payload = {
        aboutShort: about || '',
        teacherSubjects: list,
        ...tContacts,
      };

      await api(`/admin/teachers/${teacherProfileId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      await api(`/admin/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ phone: phone || null, email: email || null }),
      });

      // апсерт публичной цены
      if (subjId) {
        const teacherKop = Math.round(parseFloat((priceRub || '0').replace(',', '.')) * 100);
        const pubKop = Math.round(parseFloat((publicPriceRub || '0').replace(',', '.')) * 100);
        if (teacherKop > 0 || pubKop > 0) {
          await upsertPricing(id, subjId, teacherKop > 0 ? teacherKop : undefined, pubKop > 0 ? pubKop : undefined);
        }
      }

      // если новое фото выбрано — заливаем и сохраняем
      if (photoFile) {
        const { url } = await uploadTeacherPhotoFile(teacherProfileId, photoFile); // ← правильный POST
        await patchTeacherPhoto(teacherProfileId, url);                             // ← фиксируем в профиле
        setPhotoUrl(url);
        if (photoPreview) URL.revokeObjectURL(photoPreview);
        setPhotoPreview(null);
        setPhotoFile(null);
      }

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
              <label className="text-sm block mb-1">Описание</label>
              <input className="w-full rounded border px-3 py-2" value={about} onChange={e=>setAbout(e.target.value)} />
            </div>

            <div>
              <label className="text-sm block mb-1">Фото</label>
              {photoPreview
                ? <img src={photoPreview} alt="preview" className="mb-2 h-24 w-24 object-cover rounded" />
                : (photoUrl ? <img src={photoUrl} alt="photo" className="mb-2 h-24 w-24 object-cover rounded" /> : null)}
              <input
                type="file"
                accept="image/*"
                onChange={(e)=>onEditPhotoChange(e.currentTarget.files?.[0] || null)}
              />
              <p className="text-xs text-gray-500 mt-1">Выберите файл и нажмите «Сохранить» ниже.</p>
            </div>

            <div>
              <label className="text-sm block mb-1">Предмет</label>
              <select className="w-full rounded border px-3 py-2" value={subjId} onChange={e=>setSubjId(e.target.value)}>
                <option value="">— выберите —</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div><label className="text-sm block mb-1">Длительность (мин)</label><input className="w-full rounded border px-3 py-2" value={duration} onChange={e=>setDuration(e.target.value)} /></div>
            <div><label className="text-sm block mb-1">Цена (₽)</label><input className="w-full rounded border px-3 py-2" value={priceRub} onChange={e=>setPriceRub(e.target.value)} placeholder="для начисления преподавателю" /></div>
            <div><label className="text-sm block mb-1">Публичная цена (₽)</label><input className="w-full rounded border px-3 py-2" value={publicPriceRub} onChange={e=>setPublicPriceRub(e.target.value)} placeholder="видна ученикам/на сайте" /></div>

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
        </section>
      )}
    </div>
  );
}
