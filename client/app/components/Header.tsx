'use client';

import {useEffect, useMemo, useState} from 'react';
import {usePathname} from 'next/navigation';
import Link from 'next/link';
import {
  Dropdown, DropdownTrigger, DropdownMenu, DropdownItem,
  Button, Spinner
} from '@heroui/react';
import styles from './Header.module.css';

type Category = { id: string; name: string };
const api = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '');

function TeachersDropdown() {
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch(`${api}/categories`, {cache: 'no-store'});
        const data = await r.json();
        if (alive && Array.isArray(data)) setCats(data);
      } catch {}
      finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, []);

  const items = useMemo(() => {
    const base: JSX.Element[] = [
      <DropdownItem as={Link} key="all" href="/teachers">Все категории</DropdownItem>,
    ];

    if (loading) {
      base.push(
        <DropdownItem key="loading" isDisabled startContent={<Spinner size="sm" />}>
          Загрузка…
        </DropdownItem>
      );
      return base;
    }

    if (!cats.length) {
      base.push(<DropdownItem key="empty" isDisabled>Категории не найдены</DropdownItem>);
      return base;
    }

    return base.concat(
      cats.map(c => (
        <DropdownItem as={Link} key={c.id} href={`/teachers?categoryId=${encodeURIComponent(c.id)}`}>
          {c.name}
        </DropdownItem>
      ))
    );
  }, [cats, loading]);

  return (
    <li className={`${styles.menuItem} relative`}>
      <Dropdown placement="bottom-start">
        <DropdownTrigger>
          <Button
            variant="ghost"
            radius="sm"
            className={`${styles.navLink} inline-flex items-center gap-1 px-3 py-2`}
            endContent={<span aria-hidden>▾</span>}
          >
            Преподаватели
          </Button>
        </DropdownTrigger>
        <DropdownMenu
           aria-label="Категории преподавателей"
            classNames={{
              base: "bg-white shadow-lg rounded-large min-w-[240px] p-1",
              list: "flex flex-col gap-1"
            }}
            itemClasses={{
              base: "rounded-md px-3 py-2 text-default-700 data-[hover=true]:bg-default-100"
            }}
        >
          {items}
        </DropdownMenu>
      </Dropdown>
    </li>
  );
}

/** Универсальный выпадающий список БЕЗ «повторения заголовка» первым пунктом */
function StaticDropdown({
  title, items,
}:{ title: string; items: {title:string; href:string}[]; }) {
  const children = useMemo(() => {
    const lower = title.trim().toLowerCase();
    return items
      .filter(it => (it.title || '').trim().toLowerCase() !== lower) // на случай, если в items вдруг подсунут дубликат
      .map((it,i) => (
        <DropdownItem as={Link} key={`${title}-${i}`} href={it.href}>{it.title}</DropdownItem>
      ));
  }, [title, items]);

  return (
    <li className={`${styles.menuItem} relative`}>
      <Dropdown placement="bottom-start">
        <DropdownTrigger>
          <Button
            variant="ghost"
            radius="sm"
            className={`${styles.navLink} inline-flex items-center gap-1 px-3 py-2`}
            endContent={<span aria-hidden>▾</span>}
          >
            {title}
          </Button>
        </DropdownTrigger>
        <DropdownMenu
          aria-label={title}
          classNames={{
              base: "bg-white shadow-lg rounded-large min-w-[240px] p-1",
              list: "flex flex-col gap-1"
            }}
            itemClasses={{
              base: "rounded-md px-3 py-2 text-default-700 data-[hover=true]:bg-default-100"
            }}
        >
          {children}
        </DropdownMenu>
      </Dropdown>
    </li>
  );
}

function HomeHeader() {
  const leftMenu = [{ title: 'Стоимость', href: '/prices' }];
  const rightMenu = [{ title: 'Вопросы и ответы', href: '/faq' }];

  return (
    <header className={styles.header}>
      <div className={`${styles.container} flex items-center`}>
        <ul id="main-nav-left" className={`${styles.leftNavList} flex items-center gap-3`}>
          <TeachersDropdown />
          {leftMenu.map((item, i) => (
            <li className={styles.menuItem} key={`l-${i}`}>
              <Link className={`${styles.navLink} inline-flex items-center px-3 py-2`} href={item.href}>
                {item.title}
              </Link>
            </li>
          ))}
          <StaticDropdown
            title="Материалы"
            items={[
              { title: 'Статьи', href: '/interesnye-stati' },
              { title: 'Вебинары', href: '/webinary' },
              { title: 'Отзывы', href: '/reviews' }
            ]}
          />
        </ul>

        <Link href="/" className={`${styles.logo} mx-auto h-10 inline-flex items-center`}>
          <img src="/logo.png" alt="SkypeSchool" className="h-20 w-auto object-contain" />
        </Link>

        <ul id="main-nav-right" className={`${styles.rightNavList} flex items-center gap-3`}>
          <StaticDropdown
            title="О нас"
            items={[
              { title: 'О школе', href: '/about' },
              { title: 'Контакты', href: '/contacts' },
              { title: 'Правовые документы', href: '/legal' },
            ]}
          />
          {rightMenu.map((item, i) => (
            <li className={styles.menuItem} key={`r-${i}`}>
              <Link className={`${styles.navLink} inline-flex items-center px-3 py-2`} href={item.href}>
                {item.title}
              </Link>
            </li>
          ))}
          <li className={styles.menuItem}>
            <Link className={`${styles.signIn} inline-flex items-center px-3 py-2`} href="/login">
              Вход <span className={styles.loginCircle} aria-hidden="true" />
            </Link>
          </li>
        </ul>
      </div>
    </header>
  );
}

function AltHeader() {
  return (
    <header className={styles.header}>
      <div className={`${styles.container} flex items-center`}>
        <Link href="/" className="shrink-0 h-10 inline-flex items-center">
          <img src="/logo.png" alt="SkypeSchool" className="h-15 w-auto object-contain" />
        </Link>

        <nav className="mx-auto">
          <ul className="flex items-center gap-3">
            <TeachersDropdown />
            <li className={styles.menuItem}>
              <Link className={`${styles.navLink} inline-flex items-center px-3 py-2`} href="/prices">Стоимость</Link>
            </li>
            <StaticDropdown
              title="Статьи"
              items={[
                { title: 'Статьи', href: '/interesnye-stati' },
                { title: 'Отзывы', href: '/reviews' },
                { title: 'FAQ', href: '/faq' },
              ]}
            />
            <StaticDropdown
              title="О школе"
              items={[
                { title: 'О школе', href: '/about' },
                { title: 'Контакты', href: '/contacts' },
                { title: 'Правовые документы', href: '/legal' },
              ]}
            />
            <li className={styles.menuItem}>
              <Link className={`${styles.navLink} inline-flex items-center px-3 py-2`} href="/faq">Вопросы и ответы</Link>
            </li>
          </ul>
        </nav>

        <div className="shrink-0">
          <Link className={`${styles.signIn} inline-flex items-center px-3 py-2`} href="/login">
            Вход <span className={styles.loginCircle} aria-hidden="true" />
          </Link>
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
