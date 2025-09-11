'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type Item = {
  id: string;
  login: string;
  firstName: string | null;
  lastName: string | null;
  role: 'admin' | 'teacher' | 'student';
  balance: number;
  phone?: string | null;
  email?: string | null;
  avatar?: string | null;
  createdAt?: string | null;
};

type Subject = { id: string; name: string };

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

const norm = (s?: string | null) => (s || '').toLowerCase().trim();
const digits = (s?: string | null) => (s || '').replace(/\D/g, '');
function matchUser(u: Item, q: string) {
  if (!q) return true;
  const nq = norm(q);
  const dq = digits(q);
  return (
    norm(u.login).includes(nq) ||
    norm(u.firstName).includes(nq) ||
    norm(u.lastName).includes(nq) ||
    norm(u.email).includes(nq) ||
    (!!dq && digits(u.phone).includes(dq))
  );
}

export default function AdminPeoplePage() {
  // поиск
  const [q, setQ] = useState('');
  const [all, setAll] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // создание — общие поля
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirst] = useState('');
  const [lastName, setLast] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  // контакты ученика
  const [contact, setContact] = useState({
    skype: '', vk: '', google: '', whatsapp: '', max: '', discord: '',
  });

  // поля преподавателя
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [about, setAbout] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [subjectId, setSubjectId] = useState('');
  const [duration, setDuration] = useState('');
  const [price, setPrice] = useState(''); // РУБЛИ (целое)

  // контакты преподавателя (Новые поля)
  const [tContacts, setTContacts] = useState({
    contactVk: '',
    contactTelegram: '',
    contactWhatsapp: '',
    contactZoom: '',
    contactTeams: '',
    contactDiscord: '',
    contactMax: '',
  });

  const isTeacher = role === 'teacher';

  function normalizeBalance(b: any): number {
    if (typeof b === 'number') return Number.isFinite(b) ? b : 0;
    if (typeof b === 'string') { const n = parseFloat(b.replace(',', '.')); return Number.isFinite(n) ? n : 0; }
    if (b && typeof b === 'object') {
      // Prisma.Decimal
      if ('toNumber' in b && typeof (b as any).toNumber === 'function') {
        try { const n = (b as any).toNumber(); return Number.isFinite(n) ? n : 0; } catch {}
      }
      if ('value' in b) { const n = Number((b as any).value); return Number.isFinite(n) ? n : 0; }
    }
    const n = Number(b); return Number.isFinite(n) ? n : 0;
  }

  async function loadAll() {
    setLoading(true); setErr(null);
    try {
      const r = await api<{ items: Item[] } | Item[]>(`/admin/users`);
      setAll((Array.isArray(r) ? r : (r.items ?? [])).map((u:any)=>({...u, balance: normalizeBalance(u.balance)})));
    } catch (e: any) {
      setErr(e?.message || 'Не удалось загрузить пользователей');
      setAll([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAll(); }, []);

  useEffect(() => {
    if (!isTeacher) return;
    (async () => {
      try {
        const s = await api<Subject[] | { items: Subject[] }>(`/subjects`);
        setSubjects(Array.isArray(s) ? s : (s.items ?? []));
      } catch { /* ignore */ }
    })();
  }, [isTeacher]);

  // локальная фильтрация
  const items = useMemo(() => {
    const qq = q.trim();
    if (!qq) return all;
    return all.filter((u) => matchUser(u, qq));
  }, [all, q]);

async function onCreate() {
  setMsg(null); setErr(null);

  // нормализация сообщений уникальности
  const nice = (err: any) => {
    const raw = err?.message ? String(err.message) : String(err || '');
    let msg = raw;
    try { const j = JSON.parse(raw); if (j?.message) msg = String(j.message); } catch {}
    if (/login_taken|unique.*login/i.test(msg)) return 'Логин уже занят';
    if (/email_taken|unique.*email/i.test(msg)) return 'Этот E-mail уже используется';
    if (/phone_taken|unique.*phone/i.test(msg)) return 'Этот телефон уже используется';
    if (/unique_constraint_violation/i.test(msg)) return 'Логин/E-mail/телефон уже заняты';
    return msg || 'Ошибка';
  };

  try {
    const l = login.trim();
    if (!l) throw new Error('Укажи логин');

    if (role === 'student') {
      // 1) создаём пользователя
      let created: any;
      try {
        created = await api<any>(`/admin/users`, {
          method: 'POST',
          body: JSON.stringify({
            role: 'student',
            login: l,
            firstName: firstName || undefined,
            lastName: lastName || undefined,
            password: password || undefined, // опционально
            phone: phone || undefined,
            email: email || undefined,
          }),
        });
      } catch (e: any) {
        throw new Error(nice(e));
      }

      const newUserId = created?.user?.id || created?.id;
      const newUserLogin = created?.user?.login || created?.login;

      // 2) дублируем phone/email (совместимость со старой схемой)
      try {
        await api(`/admin/users/${newUserId}`, {
          method: 'PATCH',
          body: JSON.stringify({ phone: phone || null, email: email || null }),
        });
      } catch {}

      // 3) контакты ученика (если есть форма)
      try {
        await api(`/admin/students/${newUserId}`, {
          method: 'PATCH',
          body: JSON.stringify({
            contactSkype: contact.skype || null,
            contactVk: contact.vk || null,
            contactGoogle: contact.google || null,
            contactWhatsapp: contact.whatsapp || null,
            contactMax: contact.max || null,
            contactDiscord: contact.discord || null,
          }),
        });
      } catch {}

      setMsg(`Создан ученик ${newUserLogin || ''}.`);
    } else {
      // --- Преподаватель (JSON, без фото) ---
      if (!password || password.length < 8) throw new Error('Для преподавателя пароль обязателен (мин. 8)');
      if (!subjectId) throw new Error('Выбери предмет');

      const durationNum = parseInt(duration, 10);
      const priceRubNum = parseInt((price || '0').replace(',', '.'));
      if (!Number.isFinite(durationNum) || durationNum <= 0) throw new Error('Некорректная длительность');
      if (!Number.isFinite(priceRubNum) || priceRubNum <= 0) throw new Error('Некорректная цена');

      // 1) создаём пользователя-учителя
      let created: any;
      try {
        created = await api<any>(`/admin/users`, {
          method: 'POST',
          body: JSON.stringify({
            role: 'teacher',
            login: l,
            firstName: firstName || undefined,
            lastName: lastName || undefined,
            password,
            phone: phone || undefined,
            email: email || undefined,
          }),
        });
      } catch (e: any) {
        throw new Error(nice(e));
      }

      const userId = created?.user?.id || created?.id;
      if (!userId) throw new Error('user_not_created');

      // 2) апсерт профиля преподавателя
      try { await api(`/admin/teachers`, { method: 'POST', body: JSON.stringify({ userId }) }); } catch {}

      // 3) профиль + предметы + мессенджеры
      const teacherSubjects = [{ subjectId, duration: durationNum, price: priceRubNum }];
      const payload: any = { aboutShort: about || '', teacherSubjects, ...tContacts };
      try { await api(`/admin/teachers/${userId}`, { method: 'PUT', body: JSON.stringify(payload) }); } catch (e: any) {
        throw new Error(nice(e));
      }

      setMsg('Создан преподаватель.');
    }

    // сброс формы
    setLogin(''); setPassword(''); setFirst(''); setLast(''); setPhone(''); setEmail('');
    setAbout(''); setPhoto(null); setSubjectId(''); setDuration(''); setPrice('');
    setContact({ skype:'', vk:'', google:'', whatsapp:'', max:'', discord:'' });
    setTContacts({ contactVk:'', contactTelegram:'', contactWhatsapp:'', contactZoom:'', contactTeams:'', contactDiscord:'', contactMax:'' });

    // обновляем список без перезагрузки страницы
    await loadAll();
  } catch (e: any) {
    setErr(e?.message || 'Ошибка создания');
  }
}



  async function onDelete(u: Item) {
    if (u.role === 'admin') return alert('Админа удалять нельзя');
    if (!confirm('Удалить пользователя?')) return;
    try {
      if (u.role === 'teacher') {
        const list = await api<any[]>(`/admin/teachers`);
        const prof = (Array.isArray(list) ? list : []).find(t => t?.user?.id === u.id || t?.userId === u.id);
        if (prof?.id) await api(`/admin/teachers/${prof.id}`, { method: 'DELETE' });
      } else if (u.role === 'student') {
        try { await api(`/admin/students/${u.id}`, { method: 'DELETE' }); } catch {}
      }
      await api(`/admin/users/${u.id}`, { method: 'DELETE' });
      await loadAll();
    } catch (e: any) {
      alert(e?.message || 'Ошибка удаления');
    }
  }

  return (
    <main className="mx-auto max-w-6xl p-4 space-y-6">
      <section className="rounded-xl border p-4">
        <div className="font-semibold mb-3">Поиск</div>
        <form onSubmit={(e)=>e.preventDefault()} className="flex gap-2">
          <input value={q} onChange={(e)=>setQ(e.target.value)} className="w-80 rounded border px-3 py-2" placeholder="логин / телефон / email" />
          <button className="rounded border px-3 py-2" onClick={()=>setQ(q.trim())}>Искать</button>
        </form>
      </section>

      <section className="rounded-xl border p-4">
        <div className="font-semibold mb-3">Создание пользователя</div>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
          <div>
            <label className="text-sm block mb-1">Роль</label>
            <select value={role} onChange={e=>setRole(e.target.value as any)} className="w-full rounded border px-3 py-2">
              <option value="student">Ученик</option>
              <option value="teacher">Преподаватель</option>
            </select>
          </div>
          <div><label className="text-sm block mb-1">Имя</label><input className="w-full rounded border px-3 py-2" value={firstName} onChange={e=>setFirst(e.target.value)} /></div>
          <div><label className="text-sm block mb-1">Фамилия</label><input className="w-full rounded border px-3 py-2" value={lastName} onChange={e=>setLast(e.target.value)} /></div>

          <div><label className="text-sm block mb-1">Логин</label><input className="w-full rounded border px-3 py-2" value={login} onChange={e=>setLogin(e.target.value)} /></div>
          <div><label className="text-sm block mb-1">Пароль {role==='teacher' ? '(обязательно)' : '(опционально)'}</label><input className="w-full rounded border px-3 py-2" value={password} onChange={e=>setPassword(e.target.value)} /></div>

          <div><label className="text-sm block mb-1">Телефон</label><input className="w-full rounded border px-3 py-2" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+7..." /></div>
          <div><label className="text-sm block mb-1">E-mail</label><input className="w-full rounded border px-3 py-2" value={email} onChange={e=>setEmail(e.target.value)} placeholder="name@example.com" /></div>

          {/* Блок контактов ученика */}
          {role === 'student' && (
            <>
              <div><label className="text-sm block mb-1">Skype</label><input className="w-full rounded border px-3 py-2" value={contact.skype} onChange={e=>setContact({...contact, skype:e.target.value})} /></div>
              <div><label className="text-sm block mb-1">VK</label><input className="w-full rounded border px-3 py-2" value={contact.vk} onChange={e=>setContact({...contact, vk:e.target.value})} /></div>
              <div><label className="text-sm block mb-1">Google Meet</label><input className="w-full rounded border px-3 py-2" value={contact.google} onChange={e=>setContact({...contact, google:e.target.value})} /></div>
              <div><label className="text-sm block mb-1">WhatsApp</label><input className="w-full rounded border px-3 py-2" value={contact.whatsapp} onChange={e=>setContact({...contact, whatsapp:e.target.value})} /></div>
              <div><label className="text-sm block mb-1">MAX</label><input className="w-full rounded border px-3 py-2" value={contact.max} onChange={e=>setContact({...contact, max:e.target.value})} /></div>
              <div><label className="text-sm block mb-1">Discord</label><input className="w-full rounded border px-3 py-2" value={contact.discord} onChange={e=>setContact({...contact, discord:e.target.value})} /></div>
            </>
          )}

          {/* Блок создания преподавателя */}
          {role === 'teacher' && (
            <>
              <div className="md:col-span-3"><label className="text-sm block mb-1">Короткое описание</label><input className="w-full rounded border px-3 py-2" value={about} onChange={e=>setAbout(e.target.value)} /></div>
              <div><label className="text-sm block mb-1">Фото</label><input type="file" accept="image/*" onChange={e=>setPhoto(e.currentTarget.files?.[0] || null)} /></div>
              <div><label className="text-sm block mb-1">Предмет</label>
                <select className="w-full rounded border px-3 py-2" value={subjectId} onChange={e=>setSubjectId(e.target.value)}>
                  <option value="">— выберите —</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div><label className="text-sm block mb-1">Длительность (мин)</label><input className="w-full rounded border px-3 py-2" value={duration} onChange={e=>setDuration(e.target.value)} /></div>
              <div><label className="text-sm block mb-1">Цена (₽)</label><input className="w-full rounded border px-3 py-2" value={price} onChange={e=>setPrice(e.target.value)} /></div>

              {/* Контакты преподавателя: VK, Telegram, WhatsApp, Zoom, Teams, Discord, MAX */}
              <div><label className="text-sm block mb-1">VK</label><input className="w-full rounded border px-3 py-2" value={tContacts.contactVk} onChange={e=>setTContacts({...tContacts, contactVk:e.target.value})} /></div>
              <div><label className="text-sm block mb-1">Telegram</label><input className="w-full rounded border px-3 py-2" value={tContacts.contactTelegram} onChange={e=>setTContacts({...tContacts, contactTelegram:e.target.value})} /></div>
              <div><label className="text-sm block mb-1">WhatsApp</label><input className="w-full rounded border px-3 py-2" value={tContacts.contactWhatsapp} onChange={e=>setTContacts({...tContacts, contactWhatsapp:e.target.value})} /></div>
              <div><label className="text-sm block mb-1">Zoom</label><input className="w-full rounded border px-3 py-2" value={tContacts.contactZoom} onChange={e=>setTContacts({...tContacts, contactZoom:e.target.value})} /></div>
              <div><label className="text-sm block mb-1">Microsoft Teams</label><input className="w-full rounded border px-3 py-2" value={tContacts.contactTeams} onChange={e=>setTContacts({...tContacts, contactTeams:e.target.value})} /></div>
              <div><label className="text-sm block mb-1">Discord</label><input className="w-full rounded border px-3 py-2" value={tContacts.contactDiscord} onChange={e=>setTContacts({...tContacts, contactDiscord:e.target.value})} /></div>
              <div><label className="text-sm block mb-1">MAX</label><input className="w-full rounded border px-3 py-2" value={tContacts.contactMax} onChange={e=>setTContacts({...tContacts, contactMax:e.target.value})} /></div>
            </>
          )}
        </div>

        <div className="mt-3 flex items-center gap-3">
          <button onClick={onCreate} className="px-3 py-2 rounded bg-gray-900 text-white">Создать</button>
          {msg && <span className="text-green-700 text-sm">{msg}</span>}
          {err && <span className="text-red-600 text-sm">{err}</span>}
        </div>
      </section>

      <section className="rounded-xl border p-4">
        <div className="font-semibold mb-3">Пользователи</div>
        <div className="overflow-auto rounded border">
          <table className="min-w-[1000px] w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left">
                <th className="p-3 w-12">Аватар</th>
                <th className="p-3">Логин / ФИО</th>
                <th className="p-3">Роль</th>
                <th className="p-3">Баланс</th>
                <th className="p-3">Телефон</th>
                <th className="p-3">E-mail</th>
                <th className="p-3 w-48 text-right">Действия</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="p-3 text-slate-500">Загрузка…</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={7} className="p-3 text-slate-500">Ничего не найдено</td></tr>
              ) : items.map(u => (
                <tr key={u.id} className="border-t">
                  <td className="p-3"><img src={u.avatar || '/img/avatar-placeholder.png'} className="h-8 w-8 rounded-full object-cover border" alt="" /></td>
                  <td className="p-3">
                    <div className="font-medium">{u.login}</div>
                    <div className="text-xs text-neutral-500">{[u.lastName, u.firstName].filter(Boolean).join(' ') || '—'}</div>
                  </td>
                  <td className="p-3">{u.role}</td>
                  <td className="p-3">{(Number.isFinite(u.balance) ? (u.balance/100).toFixed(2) : '0.00')} ₽</td>
                  <td className="p-3">{u.phone || '—'}</td>
                  <td className="p-3">{u.email || '—'}</td>
                  <td className="p-3">
                    <div className="flex justify-end gap-2">
                      <Link href={`/admin/people/${u.id}?role=${u.role === 'teacher' ? 'teacher' : 'student'}`} className="rounded border px-3 py-1.5">Открыть</Link>
                      {u.role !== 'admin' && (
                        <button onClick={() => onDelete(u)} className="rounded border px-3 py-1.5 text-rose-700">Удалить</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
