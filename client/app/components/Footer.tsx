import styles from '../Home.module.css';

export default function Footer() {
  const year = new Date().getFullYear();
  return (
   <footer className={styles.footer}>
        <div className="container">
          <div className={styles.footerLogo}>
            <img
              src="https://web.archive.org/web/20220406075452/https://skype-school.com/wp-content/uploads/2019/06/logo-test.svg"
              alt="SkypeSchool логотип"
              width={120}
              height={60}
            />
          </div>
          <div className={styles.footerColumns}>
            <div className={styles.footerColumn}>
              <h4>О школе</h4>
              <ul>
                <li>
                  <a href="#">О школе</a>
                </li>
                <li>
                  <a href="#">Статьи</a>
                </li>
                <li>
                  <a href="#">Вебинары</a>
                </li>
                <li>
                  <a href="#">Вопросы и ответы</a>
                </li>
              </ul>
            </div>
            <div className={styles.footerColumn}>
              <h4>Ученикам</h4>
              <ul>
                <li>
                  <a href="#">Преподаватели</a>
                </li>
                <li>
                  <a href="#">Стоимость уроков</a>
                </li>
                <li>
                  <a href="#">Отзывы учеников</a>
                </li>
                <li>
                  <a href="#">Сертификаты</a>
                </li>
              </ul>
            </div>
            <div className={styles.footerColumn}>
              <h4>Правовая информация</h4>
              <ul>
                <li>
                  <a href="#">Пользовательское соглашение</a>
                </li>
                <li>
                  <a href="#">Политика обработки ПДн</a>
                </li>
                <li>
                  <a href="#">Публичная оферта</a>
                </li>
                <li>
                  <a href="#">Как стать преподавателем</a>
                </li>
              </ul>
            </div>
            <div className={styles.footerColumn}>
              <h4>Контакты</h4>
              <ul>
                <li>
                  <a href="tel:+79061268888">+7 906 126‑88‑88</a>
                </li>
                <li>
                  <a href="mailto:info@skype-school.com">info@skype-school.com</a>
                </li>
                <li>
                  <a href="#">Все контакты</a>
                </li>
              </ul>
            </div>
          </div>
          <div className={styles.footerBottom}>© 2000–2025 SkypeSchool. Все права защищены.</div>
        </div>
      </footer>
  );
}
