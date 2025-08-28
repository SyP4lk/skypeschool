// client/app/components/Footer.tsx
import Link from 'next/link';
import styles from '../Home.module.css';

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.footerLogo}>
          <img
            src="/logo.jpg"
            alt="SkypeSchool логотип"
            width={120}
            height={60}
          />
        </div>

        <div className={styles.footerColumns}>
          <div className={styles.footerColumn}>
            <h4>О школе</h4>
            <ul>
              <li><Link href="/about">О школе</Link></li>
              <li><Link href="/interesnye-stati">Статьи</Link></li>
              <li><Link href="/webinars">Вебинары</Link></li>
            </ul>
          </div>

          <div className={styles.footerColumn}>
            <h4>Ученикам</h4>
            <ul>
              <li><Link href="/teachers">Преподаватели</Link></li>
              <li><Link href="/prices">Стоимость уроков</Link></li>
              <li><Link href="/reviews">Отзывы учеников</Link></li>
              <li><Link href="/certificates">Сертификаты</Link></li>
            </ul>
          </div>

          <div className={styles.footerColumn}>
            <h4>Правовая информация</h4>
            <ul>
              <li><Link href="/legal">Пользовательское соглашение</Link></li>
              <li><Link href="/legal">Политика обработки ПДн</Link></li>
              <li><Link href="/legal">Публичная оферта</Link></li>
              <li><Link href="/kak-stat-prepodavatelem">Как стать преподавателем</Link></li>
            </ul>
          </div>

          <div className={styles.footerColumn}>
            <h4>Контакты</h4>
            <ul>
              <li><a href="tel:+79061268888">+7 906 126-88-88</a></li>
              <li><a href="mailto:info@skype-school.com">info@skype-school.com</a></li>
              <li><Link href="/contacts">Все контакты</Link></li>
            </ul>
          </div>
        </div>

        <div className={styles.footerBottom}>
          © 2000–{year} SkypeSchool. Все права защищены.
        </div>
      </div>
    </footer>
  );
}
