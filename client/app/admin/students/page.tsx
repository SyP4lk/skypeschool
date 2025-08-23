'use client';

import { useEffect, useState } from 'react';
import { api } from '../_lib/api';
import Button from '../../components/ui/Button';
import Input from '@/components/ui/Input';
import { Card, CardTitle } from '@/components/ui/Card';

function genPass(len = 10) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

type Student = {
  id: string;
  login: string;
  firstName?: string | null;
  lastName?: string | null;
  balance: number;
};

export default function StudentsPage() {
  const [items, setItems] = useState<Student[]>([]);
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  async function load() {
    const data: Student[] = await api('/students');
    // скрываем soft-deleted записи
    setItems(Array.isArray(data) ? data.filter(s => !String(s.login || '').includes('__deleted__')) : []);
  }

  useEffect(() => {
    load();
  }, []);

  async function add() {
    const l = login.trim().toLowerCase();
    const p = password.trim();
    if (!l || !p) return;
    await api('/students', {
      method: 'POST',
      body: JSON.stringify({ login: l, password: p, firstName: firstName.trim() || undefined, lastName: lastName.trim() || undefined }),
    });
    setLogin('');
    setPassword('');
    setFirstName('');
    setLastName('');
    load();
  }

  async function del(id: string) {
    await api(`/students/${id}`, { method: 'DELETE' });
    load();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardTitle>Создать ученика</CardTitle>
        <div className="grid grid-cols-5 gap-3 max-w-5xl">
          <Input placeholder="Логин" value={login} onChange={e => setLogin(e.target.value)} />
          <Input placeholder="Имя" value={firstName} onChange={e => setFirstName(e.target.value)} />
          <Input placeholder="Фамилия" value={lastName} onChange={e => setLastName(e.target.value)} />
          <Input placeholder="Пароль" value={password} onChange={e => setPassword(e.target.value)} />
          <div className="flex gap-2">
            <Button type="button" onClick={() => setPassword(genPass())}>
              Сгенерировать
            </Button>
            <Button onClick={add}>Создать</Button>
          </div>
        </div>
      </Card>

      <Card>
        <CardTitle>Ученики</CardTitle>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500">
              <th>Логин</th>
              <th>Имя</th>
              <th>Фамилия</th>
              <th>Баланс</th>
              <th className="w-24" />
            </tr>
          </thead>
          <tbody>
            {items.map(s => (
              <tr key={s.id} className="border-t">
                <td className="py-2">{s.login}</td>
                <td className="py-2">{s.firstName || '-'}</td>
                <td className="py-2">{s.lastName || '-'}</td>
                <td className="py-2">{((s.balance ?? 0) / 100).toFixed(2)} ₽</td>
                <td className="py-2 text-right">
                  <Button onClick={() => del(s.id)}>Удалить</Button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td className="py-3 text-gray-500" colSpan={5}>
                  Список пуст
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
