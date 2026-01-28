'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import './admin.css';

// Локальный хелпер API: всегда через фронтовый прокси '/api'
async function api(path: string, init?: RequestInit) {
  const url =
    path.startsWith('/api')
      ? path
      : `/api${path.startsWith('/') ? path : `/${path}`}`;

  return fetch(url, {
    credentials: 'include',
    headers: { accept: 'application/json', ...(init?.headers || {}) },
    ...init,
  });
}

const Link = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a
    href={href}
    className="no-underline text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg px-3 py-2"
  >
    {children}
  </a>
);

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  async function logout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } finally {
      router.replace('/login');
    }
  }

  useEffect(() => {
    let aborted = false;

    async function guard() {
      setReady(false);
      try {
        const res = await api('/auth/me');
        if (aborted) return;

        if (res.status === 401 || !res.ok) {
          router.replace('/login');
          return;
        }

        const data = await res.json();
        const role: string | undefined = data?.user?.role ?? data?.role;

        if (role !== 'admin') {
          if (role === 'teacher') router.replace('/lk/teacher');
          else router.replace('/lk/student');
          return;
        }

        setReady(true);
      } catch {
        if (!aborted) router.replace('/login');
      }
    }

    guard();
    return () => { aborted = true; };
  }, [router]);

  if (!ready) return <div className="min-h-screen bg-gray-50" />;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex">
      <aside className="w-64 border-r border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="font-extrabold text-xl">Skype School — Admin</div>
          <button
            onClick={logout}
            className="text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg px-2 py-1"
            title="Выйти"
          >
            Выйти
          </button>
        </div>

        <nav className="grid gap-1 text-sm">
          <Link href="/admin">Дашборд</Link>
          <Link href="/admin/people">Пользователи</Link>
          <Link href="/admin/subjects">Предметы</Link>
          <Link href="/admin/categories">Категории</Link>
          <Link href="/admin/finance">Финансы</Link>
          <Link href="/admin/articles">Статьи</Link>
          <Link href="/admin/popular-lessons">Популярные уроки</Link>
          <Link href="/admin/trials">Заявки</Link>
          <Link href="/admin/support">Поддержка</Link>
        </nav>
      </aside>

      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
