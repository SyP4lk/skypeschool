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

export default function ProfileClient({ id, role }: { id: string; role: Role }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [firstName, setFirst] = useState(''); const [lastName, setLast] = useState('');
  const [pwd, setPwd] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // contacts (student)
  const [c, setC] = useState<StudentProfile>({});

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
        const r = await api(`/admin/users/${id}`);
        setUser(r.user);
        setFirst(r.user.firstName || ''); setLast(r.user.lastName || '');
      }
    } catch (e: any) {
      setErr(e?.message || String(e));
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id, role]);

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

  async function uploadAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
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
          <div>
            <label className="text-sm block">Имя</label>
            <Input value={firstName} onChange={e=>setFirst(e.target.value)} />
          </div>
          <div>
            <label className="text-sm block">Фамилия</label>
            <Input value={lastName} onChange={e=>setLast(e.target.value)} />
          </div>
          <div>
            <label className="text-sm block">Логин</label>
            <div className="p-2 border rounded bg-gray-50">{user.login}</div>
          </div>
          <div>
            <label className="text-sm block">Роль</label>
            <div className="p-2 border rounded bg-gray-50">{user.role}</div>
          </div>
          <div>
            <label className="text-sm block">Баланс</label>
            <div className="p-2 border rounded bg-gray-50">{(user.balance/100).toFixed(2)} ₽</div>
          </div>
        </div>

        {role === 'student' && (
          <>
            <div className="mt-6 grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm block">Skype</label>
                <Input value={c.contactSkype || ''} onChange={e=>setC({ ...c, contactSkype: e.target.value })} />
              </div>
              <div>
                <label className="text-sm block">VK</label>
                <Input value={c.contactVk || ''} onChange={e=>setC({ ...c, contactVk: e.target.value })} />
              </div>
              <div>
                <label className="text-sm block">Google Meet</label>
                <Input value={c.contactGoogle || ''} onChange={e=>setC({ ...c, contactGoogle: e.target.value })} />
              </div>
              <div>
                <label className="text-sm block">WhatsApp</label>
                <Input value={c.contactWhatsapp || ''} onChange={e=>setC({ ...c, contactWhatsapp: e.target.value })} />
              </div>
              <div>
                <label className="text-sm block">MAX</label>
                <Input value={c.contactMax || ''} onChange={e=>setC({ ...c, contactMax: e.target.value })} />
              </div>
              <div>
                <label className="text-sm block">Discord</label>
                <Input value={c.contactDiscord || ''} onChange={e=>setC({ ...c, contactDiscord: e.target.value })} />
              </div>
            </div>

            <div className="mt-6">
              <label className="text-sm block mb-1">Аватар</label>
              <div className="flex items-center gap-4">
                <img
                  src={profile?.avatar ? mediaUrl(profile.avatar) : '/avatar-placeholder.png'}
                  alt="avatar" className="w-16 h-16 rounded-full object-cover border"
                />
                <input type="file" accept="image/png,image/jpeg" onChange={uploadAvatar} />
              </div>
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
        <p className="text-xs text-gray-500 mt-2">
          Пароль не показываем — только задаём новый.
        </p>
      </Card>
    </div>
  );
}
