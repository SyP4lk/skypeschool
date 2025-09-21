'use client';
import { useEffect, useState } from 'react';
import { api as adminApi } from '../_lib/api'; // именно из admin/_lib/api — ЭТО ФУНКЦИЯ
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Card, CardTitle } from '@/components/ui/Card';

type Category = { id: string; name: string };

export default function CategoriesPage() {
  const [items, setItems] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  async function load() {
    try {
      const data = await adminApi<Category[]>('/categories'); // → /api/admin/categories
      // контроллер может вернуть массив или { items }
      setItems(Array.isArray(data) ? data : ((data as any)?.items ?? []));
    } catch (e: any) {
      alert(e.message || 'Ошибка загрузки категорий');
    }
  }

  useEffect(() => { load(); }, []);

  async function add() {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await adminApi('/categories', { method: 'POST', body: JSON.stringify({ name: name.trim() }) });
      setName('');
      await load();
    } catch (e: any) {
      alert(e.message || 'Не удалось добавить категорию');
    } finally {
      setLoading(false);
    }
  }

  async function del(id: string) {
    if (!confirm('Удалить категорию?')) return;
    setLoading(true);
    try {
      await adminApi(`/categories/${id}`, { method: 'DELETE' });
      setItems(s => s.filter(x => x.id !== id));
    } catch (e: any) {
      alert(e.message || 'Не удалось удалить категорию');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardTitle>Добавить категорию</CardTitle>
        <div className="flex gap-3 max-w-xl">
          <Input placeholder="Название" value={name} onChange={e => setName(e.target.value)} />
          <Button disabled={loading} onClick={add}>Добавить</Button>
        </div>
      </Card>

      <Card>
        <CardTitle>Список категорий</CardTitle>
        <ul className="grid gap-2">
          {items.map(c => (
            <li key={c.id} className="flex items-center justify-between border-t py-2">
              <span>{c.name}</span>
              <Button disabled={loading} onClick={() => del(c.id)}>Удалить</Button>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
