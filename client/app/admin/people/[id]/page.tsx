'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useParams } from 'next/navigation';
import { api } from '../../_lib/api';
import Input from '@/components/ui/Input';
import { Card, CardTitle } from '@/components/ui/Card';
import { mediaUrl } from '@/lib/media';

export default function PersonPage() {
  const params = useParams<{ id: string }>();
  const sp = useSearchParams();
  const id = params.id;
  const role = (sp.get('role') as 'student' | 'teacher') || 'student';

  const [user, setUser] = useState<any>(null);
  const [balance, setBalance] = useState<number>(0);
  const [profile, setProfile] = useState<any>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);

  async function load() {
    const [u, b] = await Promise.all([
      api(`/users/${id}`), // публичный user эндпоинт в проекте уже есть
      api(`/admin/users/${id}/balance`),
    ]);
    setUser(u);
    setFirstName(u?.firstName || '');
    setLastName(u?.lastName || '');
    setBalance(b.balance || 0);

    if (role === 'student') {
      // профиль может отсутствовать — вернём пустые поля
      try {
        const s = await api(`/students/${id}`);
        setProfile(s?.studentProfile || null);
      } catch {
        setProfile(null);
      }
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [id, role]);

  const contacts = useMemo(() => ({
    contactSkype: profile?.contactSkype || '',
    contactVk: profile?.contactVk || '',
    contactGoogle: profile?.contactGoogle || '',
    contactWhatsapp: profile?.contactWhatsapp || '',
    contactMax: profile?.contactMax || '',
    contactDiscord: profile?.contactDiscord || '',
  }), [profile]);

  async function save() {
    setSaving(true);
    try {
      await api(`/admin/students/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ firstName, lastName, ...contacts }),
      });
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function setPassword() {
    if (!newPassword || newPassword.length < 8) {
      alert('Пароль минимум 8 символов');
      return;
    }
    const res = await api(`/admin/students/${id}/password`, { method: 'POST', body: JSON.stringify({ newPassword }) });
    alert(`Новый пароль: ${res.newPassword}`);
    setNewPassword('');
  }

  async function uploadAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const fd = new FormData();
    fd.append('file', f);
    await api(`/admin/students/${id}/avatar`, { method: 'POST', body: fd as any });
    await load();
  }

  if (!user) return null;

  return (
    <div className="space-y-6">
      <Card>
        <CardTitle>{user.login} — {role === 'student' ? 'Ученик' : 'Преподаватель'}</CardTitle>
        <div className="grid grid-cols-2 gap-4 max-w-3xl">
          <div>
            <div className="text-sm text-gray-500">Баланс</div>
            <div className="text-2xl">{(balance / 100).toFixed(2)} ₽</div>
          </div>
        </div>
      </Card>

      {role === 'student' && (
        <Card>
          <CardTitle>Профиль ученика</CardTitle>
          <div className="grid grid-cols-2 gap-3 max-w-3xl">
            <Input placeholder="Имя" value={firstName} onChange={e => setFirstName(e.target.value)} />
            <Input placeholder="Фамилия" value={lastName} onChange={e => setLastName(e.target.value)} />

            <Input placeholder="Skype" defaultValue={contacts.contactSkype} onChange={e => (contacts.contactSkype = e.target.value)} />
            <Input placeholder="VK" defaultValue={contacts.contactVk} onChange={e => (contacts.contactVk = e.target.value)} />
            <Input placeholder="Google Meet" defaultValue={contacts.contactGoogle} onChange={e => (contacts.contactGoogle = e.target.value)} />
            <Input placeholder="WhatsApp" defaultValue={contacts.contactWhatsapp} onChange={e => (contacts.contactWhatsapp = e.target.value)} />
            <Input placeholder="MAX" defaultValue={contacts.contactMax} onChange={e => (contacts.contactMax = e.target.value)} />
            <Input placeholder="Discord" defaultValue={contacts.contactDiscord} onChange={e => (contacts.contactDiscord = e.target.value)} />

            <div className="col-span-2 flex items-center gap-4">
              <input type="file" accept="image/*" onChange={uploadAvatar} />
              {profile?.avatar && <img src={mediaUrl(profile.avatar)} alt="avatar" className="w-16 h-16 rounded-full object-cover" />}
            </div>

            <div className="col-span-2 flex gap-2">
              <button className="px-3 py-2 bg-gray-800 text-white rounded" onClick={save} disabled={saving}>Сохранить</button>
            </div>
          </div>
        </Card>
      )}

      {role === 'student' && (
        <Card>
          <CardTitle>Задать новый пароль</CardTitle>
          <div className="flex gap-2">
            <Input placeholder="Новый пароль (мин. 8)" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            <button className="px-3 py-2 bg-gray-800 text-white rounded" onClick={setPassword}>Установить</button>
          </div>
        </Card>
      )}
    </div>
  );
}
