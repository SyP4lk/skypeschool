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
  createdAt: string;
  _source: 'support' | 'trials';
};

export default function AdminSupportPage() {
  const [status, setStatus] = useState<'all' | InboxStatus>('new');
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [readonly, setReadonly] = useState(false);

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
    setLoading(true); setErr(null); setOk(null); setReadonly(false);
    try {
      const qs = new URLSearchParams(); if (status !== 'all') qs.set('status', status);
      const res = await api(`/admin/support${qs.toString() ? `?${qs}` : ''}`);
      const list = (Array.isArray(res) ? res : (res.items || [])).map((r: any) => ({
        id: r.id, fromLogin: r.fromLogin || r.name || '-', contact: r.contact || r.email || r.phone || null,
        message: r.message || r.text || '-', status: (r.status as InboxStatus) || 'new',
        createdAt: r.createdAt, _source: 'support' as const,
      }));
      setItems(list); setTotal(list.length);
    } catch (e1: any) {
      // фолбек на заявки — read-only
      try {
        const qs = new URLSearchParams(); if (status !== 'all') qs.set('status', status);
        const res = await api(`/admin/trials${qs.toString() ? `?${qs}` : ''}`);
        const list = (Array.isArray(res) ? res : (res.items || [])).map((r: any) => ({
          id: r.id, fromLogin: r.name || '-', contact: r.contact || r.email || r.phone || null,
          message: r.message || '-', status: (r.status as InboxStatus) || 'new',
          createdAt: r.createdAt, _source: 'trials' as const,
        }));
        setItems(list); setTotal(list.length); setReadonly(true);
      } catch (e2: any) {
        setErr(e2?.message || e1?.message || 'Не удалось загрузить сообщения');
      }
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [status]);

  async function setRowStatus(row: Row, next: InboxStatus) {
    if (readonly) return; // в фолбеке не меняем
    setErr(null); setOk(null);
    try {
      await api(`/admin/support/${row.id}`, { method: 'PATCH', body: JSON.stringify({ status: next }) });
      setOk(next === 'processed' ? 'Помечено как обработано' : 'Вернули в «Новые»');
      await load();
    } catch (e: any) {
      setErr(e?.message || 'Не удалось обновить статус');
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
          {readonly && <span className="text-xs text-gray-500">режим только чтение (нет /admin/support)</span>}
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
                  {readonly ? (
                    <span className="text-xs text-gray-400">только чтение</span>
                  ) : r.status === 'new' ? (
                    <button className="text-sm px-2 py-1 rounded bg-green-600 text-white" onClick={() => setRowStatus(r, 'processed')}>Обработать</button>
                  ) : (
                    <button className="text-sm px-2 py-1 rounded bg-gray-700 text-white" onClick={() => setRowStatus(r, 'new')}>В «Новые»</button>
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
