'use client';
import { useEffect, useState } from 'react';
import { api } from '../_lib/api';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Card, CardTitle } from '@/components/ui/Card';

export default function CategoriesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [name, setName] = useState('');

  async function load() { setItems(await api('/categories')); }
  useEffect(() => { load(); }, []);

  async function add() { if (!name.trim()) return; await api('/categories', { method: 'POST', body: JSON.stringify({ name }) }); setName(''); load(); }
  async function del(id: string) { await api(`/categories/${id}`, { method: 'DELETE' }); load(); }

  return (
    <div className="space-y-6">
      <Card>
        <CardTitle>Добавить категорию</CardTitle>
        <div className="flex gap-3 max-w-xl">
          <Input placeholder="Название" value={name} onChange={e=>setName(e.target.value)} />
          <Button onClick={add}>Добавить</Button>
        </div>
      </Card>

      <Card>
        <CardTitle>Список категорий</CardTitle>
        <ul className="grid gap-2">
          {items.map((c:any)=>(
            <li key={c.id} className="flex items-center justify-between border-t py-2">
              <span>{c.name}</span>
              <Button onClick={()=>del(c.id)}>Удалить</Button>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
