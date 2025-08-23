'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import './admin.css';

const Link = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a
    href={href}
    className="no-underline text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg px-3 py-2"
  >
    {children}
  </a>
);

type Me = { id: string; login: string; role: 'admin' | 'teacher' | 'student' };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  const apiBase = useMemo(
    () => (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api').replace(/\/+$/, ''),
    []
  );

  useEffect(() => {
    let aborted = false;

    async function guard() {
      setReady(false);
      try {
        const res = await fetch(`${apiBase}/auth/me`, {
          credentials: 'include',
          cache: 'no-store',
        });

        // Неавторизован — уводим на /login
        if (res.status === 401) {
          if (!aborted) router.replace('/login');
          return;
        }

        if (!res.ok) {
          // Любая иная ошибка — на страницу логина
          if (!aborted) router.replace('/login');
          return;
        }

        const me: Me = await res.json();

        if (me?.role !== 'admin') {
          // Авторизован, но не админ — уводим в свой кабинет
          if (!aborted) {
            if (me.role === 'teacher') router.replace('/teacher');
            else router.replace('/student');
          }
          return;
        }

        if (!aborted) setReady(true);
      } catch {
        if (!aborted) router.replace('/login');
      }
    }

    guard();
    return () => {
      aborted = true;
    };
  }, [apiBase, router, pathname]);

  async function logout() {
    try {
      await fetch(`${apiBase}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } finally {
      router.replace('/login');
    }
  }

  if (!ready) {
    // Мини-скелет без мерцания
    return <div className="min-h-screen bg-gray-50" />;
  }

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
          <Link href="/admin/trials">Заявки</Link>
          <Link href="/admin/support">Поддержка</Link>
        </nav>
      </aside>

      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
