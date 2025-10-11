'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

type Subject = { id: string; name: string; slug?: string | null; category?: { name?: string | null } | null; };

export default function SubjectSearch({
  className,
  placeholder = 'Что хотите изучать?',
  ariaLabel = 'Поиск предмета или преподавателя',
}: {
  className?: string; placeholder?: string; ariaLabel?: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<Subject[]>([]);
  const [highlight, setHighlight] = useState(-1);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const ctlRef = useRef<AbortController | null>(null);
  const base = '/api';

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  useEffect(() => {
    if (!q.trim()) {
      setList([]); setOpen(false); setLoading(false);
      return;
    }
    setLoading(true); setOpen(true); setHighlight(-1);

    const t = setTimeout(async () => {
      ctlRef.current?.abort();
      const ctl = new AbortController();
      ctlRef.current = ctl;

      // 1) основной публичный маршрут
      const trySearch = async (): Promise<Subject[]> => {
        try {
          const r = await fetch(`${base}/subjects/search?query=${encodeURIComponent(q)}`, {
            signal: ctl.signal, headers: { accept: 'application/json' }, credentials: 'include',
          });
          if (r.ok) return await r.json();
        } catch {}
        // 2) fallback — общий список с query
        try {
          const r = await fetch(`${base}/subjects?query=${encodeURIComponent(q)}`, {
            signal: ctl.signal, headers: { accept: 'application/json' }, credentials: 'include',
          });
          if (r.ok) return await r.json();
        } catch {}
        // 3) последний шанс — все предметы и фильтр на клиенте
        try {
          const r = await fetch(`${base}/subjects`, {
            signal: ctl.signal, headers: { accept: 'application/json' }, credentials: 'include',
          });
          if (r.ok) {
            const all = (await r.json()) as Subject[];
            const lower = q.toLowerCase();
            return all.filter(s => s.name.toLowerCase().includes(lower)).slice(0, 10);
          }
        } catch {}
        return [];
      };

      const data = await trySearch();
      setList(data.slice(0, 10));
      setLoading(false);
    }, 200);

    return () => clearTimeout(t);
  }, [q, base]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || list.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlight(h => (h + 1) % list.length); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlight(h => (h - 1 + list.length) % list.length); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      const i = highlight >= 0 ? highlight : 0;
      const s = list[i];
      if (s) { router.push(`/teachers?subjectId=${encodeURIComponent(s.id)}`); setOpen(false); }
    } else if (e.key === 'Escape') { setOpen(false); }
  };

  const onSelect = (s: Subject) => {
    router.push(`/teachers?subjectId=${encodeURIComponent(s.id)}`);
    setOpen(false);
  };

  // было: const renderName = (name: string) => { ... }
const renderName = (name: string, q: string) => {
  const i = name.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return <span>{name}</span>;
  const before = name.slice(0, i);
  const match  = name.slice(i, i + q.length);
  const after  = name.slice(i + q.length);
  return (
    <span>
      {before}
      <span style={{ color: '#00aecd', fontWeight: 700 }}>{match}</span>
      {after}
    </span>
  );
};


  return (
    <div ref={wrapRef} className="relative flex  w-full" >
      <input
        type="text"
        className={className} 
        aria-label={ariaLabel}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => q && setOpen(true)}
        onKeyDown={onKeyDown}
        autoComplete="off"
      />
      {open && (
        <div className="absolute top-10 left-0 right-0 z-30">
          <ul className="max-h-80 overflow-auto rounded-xl border border-slate-200 bg-white shadow-xl text-slate-900">
            {loading && <li className="px-3 py-2 text-sm text-slate-500">Ищу…</li>}
            {!loading && list.length === 0 && <li className="px-3 py-2 text-sm text-slate-500">Ничего не найдено</li>}
            {!loading && list.map((s, i) => (
              <li
                key={s.id}
                className={`px-3 py-2 cursor-pointer text-sm flex items-center gap-3 ${i === highlight ? 'bg-slate-50' : ''}`}
                onMouseEnter={() => setHighlight(i)}
                onMouseDown={(e) => { e.preventDefault(); onSelect(s); }}
              >
                {/* Левый блок — растягивается, НЕ переносится */}
                <span className="flex-1 min-w-0 whitespace-nowrap">
                  {renderName(s.name, q)}
                </span>

                {/* Правый блок — категория, не сжимается и без переносов */}
                {s.category?.name && (
                  <span className="shrink-0 whitespace-nowrap text-xs text-slate-500">
                    {s.category.name}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
