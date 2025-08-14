'use client';

// те же пункты меню, что и в Header.tsx
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

// переиспользуем тот же модуль стилей — функционал дропдаунов сохраняется
import styles from './Header.module.css';

export default function HeaderAlt() {
  return (
    <header
      className={
        // базовый layout из модуля + альтернативная «кожа»
        `${styles.header} bg-slate-900 text-white border-b border-slate-800`
      }
    >
      <div className={`${styles.container} py-3`}>
        {/* Лево */}
        <ul className={`${styles.leftNavList}`}>
          {leftMenu.map((item, idx) => (
            <li className={styles.menuItem} key={`l-${idx}`}>
              <a
                className={`${styles.navLink} text-white/90 hover:text-sky-300`}
                href={item.href ?? '#'}
              >
                {item.title}
              </a>
              {item.children && (
                <div className={`${styles.dropdown}`}>
                  <ul>
                    {item.children.map((child, ci) => (
                      <li className={styles.dropdownItem} key={`l-${idx}-c-${ci}`}>
                        <a className={`${styles.dropdownLink}`} href={child.href}>
                          {child.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          ))}
        </ul>

        {/* Логотип по центру (как в исходном Header) */}
        <div className="flex items-center justify-center mx-6">
          <a href="/" className="inline-flex items-center gap-2">
            {/* если в исходной шапке есть <img> — можно повторить; здесь просто текст */}
            <span className="text-xl font-extrabold tracking-tight">SkypeSchool</span>
          </a>
        </div>

        {/* Право */}
        <ul className={`${styles.rightNavList}`}>
          {rightMenu.map((item, idx) => (
            <li className={styles.menuItem} key={`r-${idx}`}>
              <a className={`${styles.navLink} text-white/90 hover:text-sky-300`} href={item.href ?? '#'}>
                {item.title}
              </a>
            </li>
          ))}
          <li className={styles.menuItem}>
            <a
              className={
                // кнопка «Вход»: делаем контурной на тёмном фоне
                `${styles.signIn} border border-white/20 text-white hover:bg-white/10`
              }
              href="/login"
            >
              Вход
              <span className="ml-2 inline-block h-2.5 w-2.5 rounded-full bg-sky-400/80" aria-hidden="true" />
            </a>
          </li>
        </ul>
      </div>
    </header>
  );
}
