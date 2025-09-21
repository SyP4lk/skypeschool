'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardTitle } from '@/components/ui/Card';
import Select from '@/components/ui/Select';
import Input from '@/components/ui/Input';
import { api } from '../_lib/api';

type InboxStatus = 'new' | 'processed';
type Row = {
  id: string;
  name: string;
  contact?: string | null;
  message?: string | null;
  status: InboxStatus;
  createdAt: string;
  subjectName?: string | null;
  _source?: 'trials' | 'trial-requests';
};

export default function AdminTrialsPage() {
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
      [r.name, r.contact, r.message, r.subjectName]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [items, query]);

  async function load() {
    setLoading(true); setErr(null); setOk(null);
    try {
      const qs = new URLSearchParams(); if (status !== 'all') qs.set('status', status);
      async function fetchList(path: string): Promise<Row[]> {
        const res = await api(`${path}${qs.toString() ? `?${qs}` : ''}`);
        const list = Array.isArray(res) ? res : (res.items || []);
        return (list || []).map((r: any) => ({
          id: r.id,
          name: r.name || r.fromLogin || '-',
          contact: r.contact || r.email || r.contactEmail || r.phone || r.contactPhone || null,
          message: r.message || r.text || null,
          status: (r.status as InboxStatus) || 'new',
          createdAt: r.createdAt,
          subjectName: r.subject?.name || r.subjectName || null,
        }));
      }
      // основной контракт
      let list = await fetchList('/admin/trials');
      let source: Row['_source'] = 'trials';

      // фолбек — если пусто/ошибка
      if (!Array.isArray(list)) list = [];
      list = list.map(r => ({ ...r, _source: source }));
      setItems(list);
      setTotal(list.length);
    } catch (e1: any) {
      try {
        const qs = new URLSearchParams(); if (status !== 'all') qs.set('status', status);
        const res = await api(`/admin/trial-requests${qs.toString() ? `?${qs}` : ''}`);
        const list = (Array.isArray(res) ? res : (res.items || [])).map((r: any) => ({
          id: r.id, name: r.name || '-', contact: r.contact || r.email || r.phone || null,
          message: r.message || null, status: (r.status as InboxStatus) || 'new',
          createdAt: r.createdAt, subjectName: r.subject?.name || null, _source: 'trial-requests' as const,
        }));
        setItems(list); setTotal(list.length);
      } catch (e2: any) {
        setErr(e2?.message || e1?.message || 'Не удалось загрузить список');
      }
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [status]);

  async function setRowStatus(row: Row, next: InboxStatus) {
    setErr(null); setOk(null);
    const path = row._source === 'trial-requests' ? '/admin/trial-requests' : '/admin/trials';
    try {
      await api(`${path}/${row.id}`, { method: 'PATCH', body: JSON.stringify({ status: next }) });
      setOk(next === 'processed' ? 'Помечено как обработано' : 'Вернули в «Новые»');
      await load();
    } catch (e: any) {
      setErr(e?.message || 'Не удалось обновить статус');
    }
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardTitle>Заявки на бесплатный урок</CardTitle>

        <div className="flex flex-wrap items-center gap-3">
          <Select value={status} onChange={(e) => setStatus(e.target.value as any)}>
            <option value="new">Новые</option>
            <option value="processed">Обработанные</option>
            <option value="all">Все</option>
          </Select>

          <Input placeholder="Поиск (имя, контакт, сообщение, предмет)" value={query} onChange={(e) => setQuery(e.target.value)} />
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
              <th className="py-2 px-3">Имя</th>
              <th className="py-2 px-3">Контакт</th>
              <th className="py-2 px-3">Предмет</th>
              <th className="py-2 px-3">Сообщение</th>
              <th className="py-2 px-3">Статус</th>
              <th className="py-2 px-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t align-top">
                <td className="py-2 px-3 whitespace-nowrap">{new Date(r.createdAt).toLocaleString('ru-RU')}</td>
                <td className="py-2 px-3">{r.name}</td>
                <td className="py-2 px-3">{r.contact || '—'}</td>
                <td className="py-2 px-3">{r.subjectName || '—'}</td>
                <td className="py-2 px-3 max-w-[420px]"><div className="line-clamp-3 break-words">{r.message || '—'}</div></td>
                <td className="py-2 px-3">
                  <span className={r.status === 'new' ? 'text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800' : 'text-xs px-2 py-1 rounded bg-green-100 text-green-800'}>
                    {r.status === 'new' ? 'Новая' : 'Обработана'}
                  </span>
                </td>
                <td className="py-2 px-3 whitespace-nowrap">
                  {r.status === 'new' ? (
                    <button className="text-sm px-2 py-1 rounded bg-green-600 text-white" onClick={() => setRowStatus(r, 'processed')}>Обработать</button>
                  ) : (
                    <button className="text-sm px-2 py-1 rounded bg-gray-700 text-white" onClick={() => setRowStatus(r, 'new')}>В «Новые»</button>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td className="py-4 px-3 text-gray-500" colSpan={7}>{loading ? 'Загрузка…' : 'Пока нет заявок'}</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
