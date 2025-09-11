'use client';
import { useEffect, useState } from 'react';
import { apiJson as api } from '@/lib/api';
import Button from '../../components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { Card, CardTitle } from '@/components/ui/Card';

export default function SubjectsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [cats, setCats] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');

  async function load() {
    const [subjects, categories] = await Promise.all([api('/subjects'), api('/categories')]);
    setItems(subjects); setCats(categories);
    if (!categoryId && categories[0]) setCategoryId(categories[0].id);
  }
  useEffect(() => { load(); }, []);

  async function add() {
    if (!name.trim()) return;
    await api('/subjects', { method: 'POST', json: { name, categoryId } });
    setName(''); load();
  }
  async function del(id: string) { await api(`/subjects/${id}`, { method: 'DELETE' }); load(); }

  return (
    <div className="space-y-6">
      <Card>
        <CardTitle>Добавить предмет</CardTitle>
        <div className="grid grid-cols-3 gap-3 max-w-3xl">
          <Input placeholder="Название предмета" value={name} onChange={e=>setName(e.target.value)} />
          <Select value={categoryId} onChange={e=>setCategoryId(e.target.value)}>
            {cats.map((c:any)=>(<option key={c.id} value={c.id}>{c.name}</option>))}
          </Select>
          <Button onClick={add}>Добавить</Button>
        </div>
      </Card>

      <Card>
        <CardTitle>Список предметов</CardTitle>
        <table className="w-full text-sm">
          <thead><tr className="text-left text-gray-500"><th>Название</th><th>Категория</th><th className="w-24"/></tr></thead>
          <tbody>
            {items.map((s:any)=>(
              <tr key={s.id} className="border-t">
                <td className="py-2">{s.name}</td>
                <td className="py-2">{s.category?.name}</td>
                <td className="py-2 text-right"><Button onClick={()=>del(s.id)}>Удалить</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
