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
            src="/logo.png"
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
              <li><a href="tel:+79093443705">+7 909 344-37-05</a></li>
              <li><a href="mailto:info@skype-school.com">info@skype-school.com</a></li>
              <li><Link href="/contacts">Все контакты</Link></li>
            </ul>

            {/* Соцсети — иконки. Подставь свои href и src */}
            <div className="mt-3 flex items-center gap-3">
              <a href="https://vk.com/id147351527" target="_blank" rel="noopener noreferrer" aria-label="VK">
                <img src="/social_vk.svg" alt="VK" width={28} height={28} className="inline-block" />
              </a>
              <a href="https://t.me/Marinaskypeschool" target="_blank" rel="noopener noreferrer" aria-label="VK">
                <img src="/telegram.svg" alt="VK" width={28} height={28} className="inline-block" />
              </a>
              <a href="https://www.instagram.com/skype_school_marina/" target="_blank" rel="noopener noreferrer" aria-label="VK">
                <img src="/instagram.svg" alt="VK" width={28} height={28} className="inline-block" />
              </a>
              <a href="https://wa.me/79093443705" target="_blank" rel="noopener noreferrer" aria-label="VK">
                <img src="/whatsapp.svg" alt="VK" width={28} height={28} className="inline-block" />
              </a>
              <a href="https://us04web.zoom.us/j/4494562149?pwd=yKxhoXhsbuPourJGkz84Pt2gKFSKRI.1" target="_blank" rel="noopener noreferrer" aria-label="Zoom" title="Открыть Zoom">
              <img src="/zoom.svg" alt="Zoom" width={28} height={28} />
            </a>
            <a
              href="https://teams.live.com/l/chat/0/0?users=duranovamar@hotmail.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Microsoft Teams"
              title="Написать в Microsoft Teams"
            >
              <img src="/teams.svg" alt="Microsoft Teams" width={28} height={28} />
            </a>
            
            </div>
          </div>
        </div>

        <div className={styles.footerBottom}>
          © 2000–{year} SkypeSchool. Все права защищены.
        </div>
      </div>
    </footer>
  );
}
