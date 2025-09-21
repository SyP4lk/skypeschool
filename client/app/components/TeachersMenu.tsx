'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

type Category = { id: string; name: string };

export default function TeachersMenu() {
  const api = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '');
  const [cats, setCats] = useState<Category[]>([]);
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`${api}/categories`, { cache: 'no-store' });
        const data = await res.json();
        if (alive && Array.isArray(data)) setCats(data);
      } catch {
        /* noop */
      }
    })();
    return () => { alive = false; };
  }, [api]);

  const openMenu = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpen(true);
  };
  const closeMenu = () => {
    timeoutRef.current = setTimeout(() => setOpen(false), 120);
  };

  return (
    <div
      className="relative group"
      onMouseEnter={openMenu}
      onMouseLeave={closeMenu}
    >
      <Link
        href="/teachers"
        className="inline-flex items-center gap-1 hover:text-blue-600"
        onFocus={openMenu}
        onBlur={closeMenu}
        onClick={() => setOpen(false)}
      >
        Преподаватели <span className="text-xs">▾</span>
      </Link>

      <div
        className={`absolute left-0 top-full z-50 mt-2 w-64 rounded-2xl border bg-white shadow-lg p-2 transition
        ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      >
        <ul className="max-h-80 overflow-auto text-sm">
          <li>
            <Link
              href="/teachers"
              className="block px-3 py-2 rounded hover:bg-gray-50"
              onClick={() => setOpen(false)}
            >
              Все категории
            </Link>
          </li>
          {cats.map((c) => (
            <li key={c.id}>
              <Link
                href={`/teachers?categoryId=${encodeURIComponent(c.id)}`}
                className="block px-3 py-2 rounded hover:bg-gray-50"
                onClick={() => setOpen(false)}
              >
                {c.name}
              </Link>
            </li>
          ))}
          {cats.length === 0 && (
            <li className="px-3 py-2 text-gray-500">Загрузка…</li>
          )}
        </ul>
      </div>
    </div>
  );
}
