'use client';

import { useEffect, useMemo, useState } from 'react';

type Category = { id: string; name: string };
type SubjectItem = {
  id: string; name: string; categoryId: string;
  minPrice?: number|null; minDuration?: number|null;
};

export default function PricesPage() {
  const api = '/api';
  const [cats, setCats] = useState<Category[]>([]);
  const [active, setActive] = useState<string | 'all'>('all');
  const [items, setItems] = useState<SubjectItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [cRes, sRes] = await Promise.all([
          fetch(`${api}/categories`, { cache: 'no-store' }),
          fetch(`${api}/subjects`,   { cache: 'no-store' }),
        ]);
        const [c, s] = await Promise.all([cRes.json(), sRes.json()]);
        setCats(Array.isArray(c) ? c : []);
        setItems(Array.isArray(s) ? s : []);
      } catch (e) {
        // no-op
      } finally {
        setLoading(false);
      }
    })();
  }, [api]);

  const visible = useMemo(
    () => items.filter(it => active === 'all' ? true : it.categoryId === active),
    [items, active]
  );

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Стоимость занятий</h1>

      {/* Категории (табы) */}
      <div className="flex gap-2 overflow-auto pb-2 mb-4 border-b">
        <button
          className={`px-3 py-1 rounded-full border ${active==='all'?'bg-black text-white':''}`}
          onClick={()=>setActive('all')}
        >
          Все
        </button>
        {cats.map(c => (
          <button key={c.id}
            className={`px-3 py-1 rounded-full border whitespace-nowrap ${active===c.id?'bg-black text-white':''}`}
            onClick={()=>setActive(c.id)}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Лента карточек */}
      {loading ? (
        <div>Загрузка…</div>
      ) : (
        <div className="relative">
          <div className="flex gap-4 overflow-x-auto snap-x pb-2">
            {visible.map(s => (
              <div key={s.id} className="min-w-[260px] snap-start shrink-0 border rounded-xl p-4">
                <div className="text-lg font-semibold mb-1">{s.name}</div>
                <div className="text-sm text-gray-500">
                  {typeof s.minPrice === 'number'
                    ? <>от {s.minPrice.toLocaleString('ru-RU')} ₽ {s.minDuration ? <>за {s.minDuration} мин</> : null}</>
                    : <>цену уточняйте</>}
                </div>
              </div>
            ))}
            {visible.length===0 && <div className="p-4 text-gray-500">Нет предметов в этой категории</div>}
          </div>
        </div>
      )}
    </main>
  );
}
