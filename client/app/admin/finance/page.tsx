'use client';
import { useEffect, useState } from 'react';
import { api } from '../_lib/api';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { Card, CardTitle } from '@/components/ui/Card';
import { fullName } from '../_lib/fullName';

export default function FinancePage(){
  const [users, setUsers] = useState<any[]>([]);
  const [userId, setUserId] = useState('');
  const [delta, setDelta] = useState('500');
  const [reason, setReason] = useState('Пополнение');

  async function load(){
    const students = await api('/students');
    const teachers = await api('/teachers');
    const flatted = [
      ...students.map((s:any)=>({ id:s.id, title: fullName(s), role:'student', balance:s.balance })),
      ...teachers.map((t:any)=>({ id:t.user.id, title: fullName(t.user), role:'teacher', balance:t.user.balance })),
    ];
    setUsers(flatted);
    if(flatted[0]) setUserId(flatted[0].id);
  }
  useEffect(()=>{ load(); }, []);

  async function adjust(){
    await api('/admin/finance/adjust', { method:'POST', body: JSON.stringify({ userId, delta: Number(delta)*100, reason }) });
    load();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardTitle>Изменить баланс</CardTitle>
        <div className="grid grid-cols-4 gap-3 max-w-4xl">
          <Select value={userId} onChange={e=>setUserId(e.target.value)}>
            {users.map(u => <option key={u.id} value={u.id}>{u.title} ({u.role})</option>)}
          </Select>
          <Input placeholder="Δ ₽" value={delta} onChange={e=>setDelta(e.target.value)} />
          <Input placeholder="Комментарий" value={reason} onChange={e=>setReason(e.target.value)} />
          <Button onClick={adjust}>Изменить</Button>
        </div>
      </Card>

      <Card>
        <CardTitle>Текущие балансы</CardTitle>
        <ul className="grid gap-1">
          {users.map(u => (
              <li key={u.id}>
                <span>{u.title}</span>
                <span className="meta">{(u.balance/100).toFixed(2)} ₽</span>
              </li>
            ))}
        </ul>
      </Card>
    </div>
  )
}
