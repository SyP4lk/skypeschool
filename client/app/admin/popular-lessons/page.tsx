
'use client';
import { useEffect, useState } from 'react';
const API = (process.env.NEXT_PUBLIC_API_URL || '/api').replace(/\/$/, '');
type PL = { id: string; imageUrl: string; subjectId: string; isActive: boolean; sort: number; subject?: any };

export default function PopularLessonsAdminPage() {
  const [items, setItems] = useState<PL[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [imageUrl, setImage] = useState('');
  const [subjectId, setSubject] = useState('');
  const [sort, setSort] = useState(0);
  const [isActive, setActive] = useState(true);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const [pl, subj] = await Promise.all([
      fetch(`${API}/admin/popular-lessons`, { credentials: 'include' }).then(r=>r.json()),
      fetch(`${API}/admin/subjects`, { credentials: 'include' }).then(r=>r.json()).catch(()=>({items:[]})),
    ]);
    setItems(pl.items || []);
    setSubjects(subj.items || subj || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function add() {
    if (!imageUrl || !subjectId) return;
    await fetch(`${API}/admin/popular-lessons`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl, subjectId, sort, isActive }),
    });
    setImage(''); setSubject(''); setSort(0); setActive(true);
    await load();
  }

  async function del(id: string) {
    await fetch(`${API}/admin/popular-lessons/${id}`, { method: 'DELETE', credentials: 'include' });
    await load();
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-xl font-semibold mb-4">Популярные уроки</h1>
      <div className="border rounded-lg p-4 mb-6">
        <div className="grid md:grid-cols-4 gap-2">
          <input placeholder="URL картинки" className="border rounded p-2" value={imageUrl} onChange={e=>setImage(e.target.value)} />
          <select className="border rounded p-2" value={subjectId} onChange={e=>setSubject(e.target.value)}>
            <option value="">Предмет…</option>
            {subjects.map((s:any)=> <option key={s.id} value={s.id}>{s.title || s.name}</option>)}
          </select>
          <input type="number" className="border rounded p-2" value={sort} onChange={e=>setSort(Number(e.target.value))} placeholder="Сортировка" />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isActive} onChange={e=>setActive(e.target.checked)} />Активен</label>
        </div>
        <button onClick={add} className="mt-3 rounded bg-black text-white py-2 px-4">Добавить</button>
      </div>

      {loading ? <div>Загрузка…</div> : (
        <div className="grid md:grid-cols-3 gap-4">
          {items.map((it)=> (
            <div key={it.id} className="border rounded-lg overflow-hidden">
              <img src={it.imageUrl} alt="" className="w-full h-40 object-cover" />
              <div className="p-3 text-sm">
                <div className="font-medium">{it.subject?.title || it.subjectId}</div>
                <div className="opacity-70">sort: {it.sort} • {it.isActive ? 'активен' : 'скрыт'}</div>
                <button onClick={()=>del(it.id)} className="mt-2 text-red-600">Удалить</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
