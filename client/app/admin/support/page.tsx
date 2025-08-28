'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardTitle } from '@/components/ui/Card';
import Select from '@/components/ui/Select';
import Input from '@/components/ui/Input';
import { api } from '../_lib/api';

type InboxStatus = 'new' | 'processed';
type Row = {
  id: string;
  fromLogin?: string | null;
  contact?: string | null;
  message: string;
  status: InboxStatus;
  createdAt: string; // ISO
};

export default function AdminSupportPage() {
  const [status, setStatus] = useState<'all' | InboxStatus>('new');
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((r) =>
      [r.fromLogin, r.contact, r.message]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [items, query]);

  async function load() {
    setLoading(true);
    setErr(null);
    setOk(null);
    try {
      const qs = new URLSearchParams();
      if (status !== 'all') qs.set('status', status);
      // GET /admin/support
      const res = await api(`/admin/support${qs.toString() ? `?${qs}` : ''}`);
      const list: Row[] = Array.isArray(res) ? res : (res.items || []);
      setItems(list || []);
      setTotal(Array.isArray(res) ? res.length : res.total ?? list.length ?? 0);
    } catch (e: any) {
      setErr(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [status]);

  async function setRowStatus(id: string, next: InboxStatus) {
    setErr(null); setOk(null);
    try {
      await api(`/admin/support/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: next }),
      });
      setOk(next === 'processed' ? 'Помечено как обработано' : 'Вернули в «Новые»');
      await load();
    } catch (e: any) {
      setErr(e?.message || String(e));
    }
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardTitle>Поддержка</CardTitle>

        <div className="flex flex-wrap items-center gap-3">
          <Select value={status} onChange={(e) => setStatus(e.target.value as any)}>
            <option value="new">Новые</option>
            <option value="processed">Обработанные</option>
            <option value="all">Все</option>
          </Select>

          <Input placeholder="Поиск (логин, контакт, текст)" value={query} onChange={(e) => setQuery(e.target.value)} />
          <button className="px-3 py-2 rounded bg-black text-white" onClick={load} type="button">Обновить</button>

          <span className="text-sm text-gray-500">{total} всего</span>
          {loading && <span className="text-sm text-gray-500">Загрузка…</span>}
          {ok && <span className="text-sm text-green-700">{ok}</span>}
          {err && <span className="text-sm text-red-600">{err}</span>}
        </div>

        <table className="w-full mt-3 border-collapse">
          <thead>
            <tr className="text-left text-sm text-gray-500">
              <th className="py-2 px-3">Дата</th>
              <th className="py-2 px-3">От</th>
              <th className="py-2 px-3">Контакт</th>
              <th className="py-2 px-3">Сообщение</th>
              <th className="py-2 px-3">Статус</th>
              <th className="py-2 px-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t align-top">
                <td className="py-2 px-3 whitespace-nowrap">{new Date(r.createdAt).toLocaleString('ru-RU')}</td>
                <td className="py-2 px-3">{r.fromLogin || '—'}</td>
                <td className="py-2 px-3">{r.contact || '—'}</td>
                <td className="py-2 px-3 max-w-[520px]"><div className="whitespace-pre-wrap break-words">{r.message}</div></td>
                <td className="py-2 px-3">
                  <span className={r.status === 'new' ? 'text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800' : 'text-xs px-2 py-1 rounded bg-green-100 text-green-800'}>
                    {r.status === 'new' ? 'Новая' : 'Обработана'}
                  </span>
                </td>
                <td className="py-2 px-3 whitespace-nowrap">
                  {r.status === 'new' ? (
                    <button className="text-sm px-2 py-1 rounded bg-green-600 text-white" onClick={() => setRowStatus(r.id, 'processed')}>
                      Обработать
                    </button>
                  ) : (
                    <button className="text-sm px-2 py-1 rounded bg-gray-700 text-white" onClick={() => setRowStatus(r.id, 'new')}>
                      В «Новые»
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td className="py-4 px-3 text-gray-500" colSpan={6}>{loading ? 'Загрузка…' : 'Пока нет сообщений'}</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
