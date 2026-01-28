'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type Article = { id: string; slug: string; title: string; createdAt: string };

function formatDate(d: string) {
  const date = new Date(d);
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

export default function AdminArticlesPage() {
  const api = '/api';
  const [items, setItems] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  async function reload() {
    setLoading(true);
    try {
      const res = await fetch(`${api}/articles?limit=100`, { cache: 'no-store', credentials: 'include' });
      const data = await res.json();
      setItems(Array.isArray(data.items) ? data.items : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { reload(); }, [api]);

  async function onDelete(id: string) {
    if (!confirm('Удалить статью?')) return;
    const res = await fetch(`${api}/admin/articles/${id}`, { method: 'DELETE', credentials: 'include' });
    if (res.ok) setItems(prev => prev.filter(a => a.id !== id));
    else alert('Не удалось удалить');
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Статьи</h1>
        <Link href="/admin/articles/new" className="px-4 py-2 rounded  text-white">Новая статья</Link>
      </div>
      {loading ? <div>Загрузка…</div> : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2">Заголовок</th>
              <th className="py-2">Slug</th>
              <th className="py-2">Дата</th>
              <th className="py-2 w-40">Действия</th>
            </tr>
          </thead>
          <tbody>
            {items.map(a => (
              <tr key={a.id} className="border-b">
                <td className="py-2 pr-2">
                  <Link href={`/interesnye-stati/${a.slug}`} className="hover:underline" target="_blank">{a.title}</Link>
                </td>
                <td className="py-2 pr-2">{a.slug}</td>
                <td className="py-2 pr-2">{formatDate(a.createdAt)}</td>
                <td className="py-2">
                  <div className="flex gap-2">
                    <Link href={`/admin/articles/${a.id}/edit`} className="px-2 py-1 rounded border">Редактировать</Link>
                    <button onClick={()=>onDelete(a.id)} className="px-2 py-1 rounded border text-red-600">Удалить</button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td className="py-4 text-gray-500" colSpan={4}>Пока нет статей</td></tr>
            )}
          </tbody>
        </table>
      )}
    </main>
  );
}
