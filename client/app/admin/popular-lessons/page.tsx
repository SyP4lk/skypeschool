'use client';

import { useEffect, useRef, useState } from 'react';
import { NotifyCenter } from '@/shared/ui/NotifyCenter';
import { notify } from '@/shared/ui/notify';

type Item = { id: string; title: string; alt: string; icon: string; order?: number };

const API = '/api';

export default function PopularLessonsAdmin() {
  const [items, setItems] = useState<Item[]>([]);
  const [title, setTitle] = useState('');
  const [alt, setAlt] = useState('');
  const [order, setOrder] = useState<number | ''>('');
  const fileRef = useRef<HTMLInputElement | null>(null);

  async function load() {
    const r = await fetch(`${API}/popular-lessons`, { cache: 'no-store' });
    const j = await r.json();
    setItems(Array.isArray(j.items) ? j.items : []);
  }

  useEffect(() => { void load(); }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (!title.trim()) throw new Error('Укажите название предмета');
      if (!fileRef.current?.files?.[0]) throw new Error('Выберите изображение');

      const fd = new FormData();
      fd.set('title', title.trim());
      fd.set('alt', (alt || title).trim());
      if (order !== '') fd.set('order', String(order));
      fd.set('file', fileRef.current.files[0]);

      const r = await fetch(`${API}/popular-lessons`, { method: 'POST', body: fd });
      if (!r.ok) throw new Error(await r.text());

      notify('Добавлено', 'success');
      setTitle(''); setAlt(''); setOrder('');
      if (fileRef.current) fileRef.current.value = '';
      await load();
    } catch (err: any) {
      notify(err?.message || 'Ошибка добавления', 'error');
    }
  }

  async function updateOrder(id: string, ord: number) {
    try {
      const r = await fetch(`${API}/popular-lessons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, order: ord }),
      });
      if (!r.ok) throw new Error(await r.text());
      await load();
    } catch (e: any) {
      notify(e?.message || 'Ошибка сохранения', 'error');
    }
  }

  async function rename(id: string, newTitle: string) {
    try {
      const r = await fetch(`${API}/popular-lessons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, title: newTitle }),
      });
      if (!r.ok) throw new Error(await r.text());
      await load();
    } catch (e: any) {
      notify(e?.message || 'Ошибка сохранения', 'error');
    }
  }

  async function del(id: string) {
    if (!confirm('Удалить карточку?')) return;
    try {
      const r = await fetch(`${API}/popular-lessons?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!r.ok) throw new Error(await r.text());
      notify('Удалено', 'success');
      await load();
    } catch (e: any) {
      notify(e?.message || 'Ошибка удаления', 'error');
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-6 space-y-6">
      <h1 className="text-xl font-semibold">Популярные уроки</h1>

      <section className="rounded-xl border p-4">
        <form className="grid md:grid-cols-2 gap-3" onSubmit={create}>
          <div className="md:col-span-2">
            <label className="text-sm block mb-1">Название предмета (как на сайте)</label>
            <input className="w-full rounded border px-3 py-2" value={title} onChange={e=>setTitle(e.target.value)} placeholder="Напр., Английский язык" />
          </div>
          <div>
            <label className="text-sm block mb-1">Alt</label>
            <input className="w-full rounded border px-3 py-2" value={alt} onChange={e=>setAlt(e.target.value)} placeholder="Подпись картинки" />
          </div>
          <div>
            <label className="text-sm block mb-1">Порядок (опц.)</label>
            <input
              className="w-full rounded border px-3 py-2"
              value={order}
              onChange={e=>setOrder(e.target.value ? Number(e.target.value) : '')}
              placeholder="0"
              inputMode="numeric"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm block mb-1">Изображение (jpg/png/webp)</label>
            <input type="file" accept="image/*" ref={fileRef} />
          </div>
          <div className="md:col-span-2">
            <button className="px-3 py-2 rounded border">Добавить</button>
          </div>
        </form>
      </section>

      <section className="rounded-xl border p-4">
        {items.length === 0 ? (
          <div className="text-sm text-gray-500">Пока пусто</div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {items.map(it => (
              <div key={it.id} className="rounded border p-3 flex gap-3">
                <img src={it.icon} alt={it.alt} className="w-28 h-20 object-cover rounded" />
                <div className="flex-1">
                  <input
                    className="w-full rounded border px-2 py-1 mb-2"
                    defaultValue={it.title}
                    onBlur={e => rename(it.id, e.target.value)}
                  />
                  <div className="flex items-center gap-2">
                    <label className="text-sm">Порядок:</label>
                    <input
                      className="w-20 rounded border px-2 py-1"
                      defaultValue={String(it.order ?? 0)}
                      onBlur={e => updateOrder(it.id, Number(e.target.value) || 0)}
                      inputMode="numeric"
                    />
                    <a
                      href={`/teachers?q=${encodeURIComponent(it.title)}`}
                      className="text-sm text-blue-600 underline"
                      target="_blank"
                    >
                      Проверить ссылку
                    </a>
                  </div>
                </div>
                <div>
                  <button className="px-2 py-1 rounded border" onClick={() => del(it.id)}>Удалить</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <NotifyCenter />
    </div>
  );
}
