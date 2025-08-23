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
  balance: number; // копейки
};

export default function PeoplePage() {
  // список
  const [role, setRole] = useState<'all' | 'student' | 'teacher'>('all');
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // создание
  const [cRole, setCRole] = useState<'student' | 'teacher'>('student');
  const [cLogin, setCLogin] = useState('');
  const [cPassword, setCPassword] = useState('');
  const [cFirst, setCFirst] = useState('');
  const [cLast, setCLast] = useState('');
  const [cMsg, setCMsg] = useState<string | null>(null);
  const [cErr, setCErr] = useState<string | null>(null);

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

  useEffect(() => {
    // загружаем при смене роли
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    await load();
  }

  async function createUser() {
    setCMsg(null);
    setCErr(null);
    try {
      const body = {
        role: cRole,
        login: cLogin.trim(),
        firstName: cFirst || undefined,
        lastName: cLast || undefined,
        password: cPassword || undefined, // если пусто — сервер сгенерит
      };
      if (!body.login) throw new Error('Укажи логин');
      if (body.password && body.password.length < 8)
        throw new Error('Пароль минимум 8 символов');

      const r = await api('/admin/users', { method: 'POST', body: JSON.stringify(body) });

      setCMsg(
        `Создан ${r.user.login} (${r.user.role}). ${
          r.newPassword ? 'Пароль: ' + r.newPassword : ''
        }`,
      );
      setCLogin('');
      setCPassword('');
      setCFirst('');
      setCLast('');
      await load();
    } catch (e: any) {
      setCErr(e?.message || String(e));
    }
  }

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

          <Input
            placeholder="Поиск по логину/имени/фамилии"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            type="submit"
            className="px-4 py-2 rounded bg-black text-white"
          >
            Найти
          </button>

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
                <td className="py-2 px-4">
                  {[u.lastName, u.firstName].filter(Boolean).join(' ') || '-'}
                </td>
                <td className="py-2 px-4">{u.login}</td>
                <td className="py-2 px-4">{u.role}</td>
                <td className="py-2 px-4">
                  {(u.balance / 100).toFixed(2)} ₽
                </td>
                <td className="py-2 px-4">
                  <Link
                    className="text-blue-600 hover:underline"
                    href={`/admin/people/${u.id}?role=${
                      u.role === 'teacher' ? 'teacher' : 'student'
                    }`}
                  >
                    Открыть
                  </Link>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td className="py-4 px-4 text-gray-500" colSpan={5}>
                  {loading ? 'Загрузка…' : 'Список пуст'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      <Card>
        <CardTitle>Создать пользователя</CardTitle>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
          <div>
            <label className="text-sm block mb-1">Роль</label>
            <Select
              value={cRole}
              onChange={(e) => setCRole(e.target.value as any)}
            >
              <option value="student">Ученик</option>
              <option value="teacher">Преподаватель</option>
            </Select>
          </div>
          <div>
            <label className="text-sm block mb-1">Логин</label>
            <Input
              value={cLogin}
              onChange={(e) => setCLogin(e.target.value)}
              placeholder="логин"
            />
          </div>
          <div>
            <label className="text-sm block mb-1">
              Пароль (необязательно)
            </label>
            <Input
              value={cPassword}
              onChange={(e) => setCPassword(e.target.value)}
              placeholder="мин. 8 символов"
            />
          </div>
          <div>
            <label className="text-sm block mb-1">Имя</label>
            <Input
              value={cFirst}
              onChange={(e) => setCFirst(e.target.value)}
              placeholder="Имя"
            />
          </div>
          <div>
            <label className="text-sm block mb-1">Фамилия</label>
            <Input
              value={cLast}
              onChange={(e) => setCLast(e.target.value)}
              placeholder="Фамилия"
            />
          </div>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <button
            className="px-3 py-2 bg-gray-800 text-white rounded"
            onClick={createUser}
            type="button"
          >
            Создать
          </button>
          {cMsg && <span className="text-green-700 text-sm">{cMsg}</span>}
          {cErr && <span className="text-red-600 text-sm">{cErr}</span>}
        </div>
      </Card>
    </div>
  );
}
