'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import styles from './Header.module.css';

type Category = { id: string; name: string };

function formatMenuLink(href: string | undefined, fallback = '#') {
  return href ?? fallback;
}

/** Дропдаун «Преподаватели» — категории с бэка */
function TeachersDropdown() {
  const api = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '');
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`${api}/categories`, { cache: 'no-store' });
        const data = await res.json();
        if (alive && Array.isArray(data)) setCats(data);
      } catch {
        /* noop */
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [api]);

  return (
    <li className={styles.menuItem}>
      <a className={styles.navLink} href="/teachers">Преподаватели</a>
      <div className={styles.dropdown}>
        <ul className={styles.dropdownList}>
          <li className={styles.dropdownItem}>
            <a className={styles.dropdownLink} href="/teachers">Все категории</a>
          </li>
          {cats.map((c) => (
            <li key={c.id} className={styles.dropdownItem}>
              <a
                className={styles.dropdownLink}
                href={`/teachers?categoryId=${encodeURIComponent(c.id)}`}
              >
                {c.name}
              </a>
            </li>
          ))}
          {cats.length === 0 && (
            <li className={styles.dropdownItem}>
              <span className={styles.dropdownLink} aria-disabled="true">
                {loading ? 'Загрузка…' : 'Категории не найдены'}
              </span>
            </li>
          )}
        </ul>
      </div>
    </li>
  );
}

/** Универсальный статический дропдаун */
function StaticDropdown(props: { title: string; items: { title: string; href: string }[]; href?: string }) {
  return (
    <li className={styles.menuItem}>
      <a className={styles.navLink} href={formatMenuLink(props.href)}>{props.title}</a>
      <div className={styles.dropdown}>
        <ul className={styles.dropdownList}>
          {props.items.map((it, i) => (
            <li className={styles.dropdownItem} key={`${props.title}-${i}`}>
              <a className={styles.dropdownLink} href={it.href}>{it.title}</a>
            </li>
          ))}
        </ul>
      </div>
    </li>
  );
}

/** Шапка для главной — оставляем вашу структуру (логотип по центру) + добавлены дропдауны */
function HomeHeader() {
  const leftMenu = [
    { title: 'Стоимость', href: '/prices' },
  ];

  const rightMenu = [
    { title: 'Вопросы и ответы', href: '/faq' },
  ];

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        {/* Бургер — только для мобилки через CSS */}
        <button
          className={styles.mobileToggle}
          aria-label="Открыть меню"
          aria-controls="main-nav"
          type="button"
        >
          <span className={styles.burger} aria-hidden="true" />
          <span className={styles.srOnly}>Меню</span>
        </button>

        {/* Левое меню */}
        <ul id="main-nav-left" className={styles.leftNavList}>
          <TeachersDropdown />
          {leftMenu.map((item, i) => (
            <li className={styles.menuItem} key={`l-${i}`}>
              <a className={styles.navLink} href={formatMenuLink(item.href)}>{item.title}</a>
            </li>
          ))}
          {/* Материалы — дропдаун */}
          <StaticDropdown
            title="Материалы"
            href="/interesnye-stati"
            items={[
              { title: 'Статьи', href: '/interesnye-stati' },
              { title: 'Вебинары', href: '/webinary' },
              { title: 'Отзывы', href: '/reviews' },
              { title: 'FAQ', href: '/faq' },
            ]}
          />
        </ul>

        {/* Лого по центру (ограничили высоту, чтобы не «вылезал») */}
        <a href="/" className={`${styles.logo} h-10 inline-flex items-center`}>
          <img src="/logo.jpg" alt="SkypeSchool" className="h-20 w-auto object-contain" />
        </a>

        {/* Правое меню */}
        <ul id="main-nav-right" className={styles.rightNavList}>
          {/* О нас — дропдаун */}
          <StaticDropdown
            title="О нас"
            href="/about"
            items={[
              { title: 'О школе', href: '/about' },
              { title: 'Контакты', href: '/contacts' },
              { title: 'Правовые документы', href: '/legal' },
            ]}
          />
          {rightMenu.map((item, i) => (
            <li className={styles.menuItem} key={`r-${i}`}>
              <a className={styles.navLink} href={formatMenuLink(item.href)}>{item.title}</a>
            </li>
          ))}
          <li className={styles.menuItem}>
            <a className={styles.signIn} href="/login">
              Вход <span className={styles.loginCircle} aria-hidden="true" />
            </a>
          </li>
        </ul>
      </div>

      <div id="main-nav" className={styles.srOnly} aria-hidden />
    </header>
  );
}

/** Альтернативная шапка — для всех страниц кроме '/' (логотип слева, меню по центру, вход справа) */
function AltHeader() {
  return (
    <header className={styles.header}>
      <div className={`${styles.container} flex items-center`}>
        {/* Лого слева, ограничиваем высоту */}
        <a href="/" className="shrink-0 h-10 inline-flex items-center">
          <img src="/logo.jpg" alt="SkypeSchool" className="h-15 w-auto object-contain" />
        </a>

        {/* Меню по центру */}
        <nav className="mx-auto">
          <ul className="flex items-center gap-4">
            <TeachersDropdown />
            <li className={styles.menuItem}>
              <a className={styles.navLink} href="/prices">Стоимость</a>
            </li>

            {/* Материалы — дропдаун */}
            <StaticDropdown
              title="Материалы"
              href="/interesnye-stati"
              items={[
                { title: 'Статьи', href: '/interesnye-stati' },
                { title: 'Вебинары', href: '/webinary' },
                { title: 'Отзывы', href: '/reviews' },
                { title: 'FAQ', href: '/faq' },
              ]}
            />

            {/* О нас — дропдаун */}
            <StaticDropdown
              title="О нас"
              href="/about"
              items={[
                { title: 'О школе', href: '/about' },
                { title: 'Контакты', href: '/contacts' },
                { title: 'Правовые документы', href: '/legal' },
              ]}
            />

            <li className={styles.menuItem}>
              <a className={styles.navLink} href="/faq">Вопросы и ответы</a>
            </li>
          </ul>
        </nav>

        {/* Вход справа */}
        <div className="shrink-0">
          <a className={styles.signIn} href="/login">
            Вход <span className={styles.loginCircle} aria-hidden="true" />
          </a>
        </div>
      </div>
    </header>
  );
}

export default function Header() {
  const pathname = usePathname();
  const isHome = pathname === '/' || pathname === '' || pathname === undefined;
  return isHome ? <HomeHeader /> : <AltHeader />;
}
