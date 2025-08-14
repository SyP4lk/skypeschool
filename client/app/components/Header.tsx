'use client';

import { useState } from 'react';
import styles from './Header.module.css';

// те же пункты, что были
type MenuItem = {
  title: string;
  href?: string;
  children?: { title: string; href: string }[];
};

const leftMenu: MenuItem[] = [
  {
    title: 'Преподаватели',
    href: '#',
    children: [
      { title: 'Иностранные языки', href: '#' },
      { title: 'Школьные предметы', href: '#' },
      { title: 'Подготовка к экзаменам', href: '#' },
    ],
  },
  {
    title: 'Цены и акции',
    href: '#',
    children: [
      { title: 'Акции', href: '#' },
      { title: 'Подарочные сертификаты', href: '#' },
    ],
  },
];

const rightMenu: MenuItem[] = [
  { title: 'О нас', href: '#' },
  { title: 'Вопросы и ответы', href: '#' },
];

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className={`${styles.header} ${open ? styles.open : ''}`}>
      <div className={styles.container}>
        {/* Бургер — показывается только на мобиле через CSS */}
        <button
          className={styles.mobileToggle}
          aria-label="Открыть меню"
          aria-expanded={open}
          aria-controls="main-nav"
          onClick={() => setOpen(v => !v)}
          type="button"
        >
          <span className={styles.burger} aria-hidden="true" />
          <span className={styles.srOnly}>Меню</span>
        </button>

        {/* Левое меню */}
        <ul id="main-nav-left" className={styles.leftNavList}>
          {leftMenu.map((item, i) => (
            <li className={styles.menuItem} key={`l-${i}`}>
              <a className={styles.navLink} href={item.href ?? '#'}>{item.title}</a>
              {item.children && (
                <div className={styles.dropdown}>
                  <ul className={styles.dropdownList}>
                    {item.children.map((c, j) => (
                      <li className={styles.dropdownItem} key={`l-${i}-c-${j}`}>
                        <a className={styles.dropdownLink} href={c.href}>{c.title}</a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          ))}
        </ul>

        {/* Логотип по центру */}
        <a href="/" className={styles.logo}>
          <img src="/logo.png" alt="SkypeSchool" />
        </a>

        {/* Правое меню */}
        <ul id="main-nav-right" className={styles.rightNavList}>
          {rightMenu.map((item, i) => (
            <li className={styles.menuItem} key={`r-${i}`}>
              <a className={styles.navLink} href={item.href ?? '#'}>{item.title}</a>
            </li>
          ))}
          <li className={styles.menuItem}>
            <a className={styles.signIn} href="/login">
              Вход <span className={styles.loginCircle} aria-hidden="true" />
            </a>
          </li>
        </ul>
      </div>

      {/* Для доступности: объединённый id для aria-controls (не обязателен) */}
      <div id="main-nav" className={styles.srOnly} aria-hidden={!open} />
    </header>
  );
}
