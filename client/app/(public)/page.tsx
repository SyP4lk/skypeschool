'use client';
/*
 * Home page of the public site.
 *
 * This server component assembles the various sections of the home page.
 * Interactive behaviour (such as the testimonial slider) lives in
 * separate client components imported into this file.  Static data for
 * categories, features, steps and testimonials is defined here for
 * simplicity.  Should these become dynamic in the future, they can be
 * fetched from an API instead.
 */

import TestimonialsSlider from '../components/TestimonialsSlider';
import styles from '../Home.module.css';
import SubjectSearch from '../components/SubjectSearch'; 
import Image, { StaticImageData } from 'next/image';
import { useState } from 'react';
import TrialRequestModal from '../components/TrialRequestModal'; 
import Link from 'next/link';
import Footer from '@/components/Footer';


// Force dynamic rendering: when Next.js builds the site in export mode,
// static prerendering of this page can cause errors related to
// clientReferenceManifest.  Declaring this constant prevents
// prerendering and ensures the runtime loads the client manifest.
export const dynamic = 'force-dynamic';
type Category = {
  title: string;
  icon: string; // путь до файла в /public
  alt: string;
};

// Data for popular categories.  Icons are represented here with emoji for
// simplicity; these can be replaced with image URLs or SVG components.
const categories: Category[] = [
  { title: 'Английский общий курс',  icon: '/icons/language-learning_7231672.png', alt: 'Английский общий курс' },
  { title: 'Высшая математика',      icon: '/icons/mathematics_672267.png',        alt: 'Высшая математика' },
  { title: 'Русский язык ЕГЭ',       icon: '/icons/premiere-rush_15584886.png',    alt: 'Русский язык ЕГЭ' },
  { title: 'Физика для школьников',  icon: '/icons/fizika_j5g6lotv576x_512.png',   alt: 'Физика для школьников' },
  { title: 'Подготовка к TOEFL',     icon: '/icons/toefl.png',                      alt: 'Подготовка к TOEFL' }, // поправь имя файла
  { title: 'Шахматы детям',          icon: '/icons/strategiya_dq10c445olj4_512.png',alt: 'Шахматы детям' },
  { title: 'Детский логопед',        icon: '/icons/logopediya_032nkwn8jwck_512.png',alt: 'Детский логопед' },
  { title: 'Рисунок и живопись',     icon: '/icons/zhivopis_zowlonpqgmy9_512.png', alt: 'Рисунок и живопись' },
  { title: 'Китайский язык',         icon: '/icons/kitaj_8bfrwpul7o2d_512.png',     alt: 'Китайский язык' },
  { title: 'Подготовка к Swedex',    icon: '/icons/shvetsiya_94kwkigeiplp_512.png', alt: 'Подготовка к Swedex' },
  { title: 'Информатика ЕГЭ ОГЭ',    icon: '/icons/informatika_0c2itb0a3w01_512.png',alt: 'Информатика ЕГЭ ОГЭ' },
];
// Data for features explaining why users choose the service.
const features = [
  {
    title: 'Гибкий график занятий',
    description:
      'Обучайтесь в удобное для вас время по предварительной договорённости с преподавателями',
    icon: '/icons/chasy_hnp0g3dtzez2_512.png',
  },
  {
    title: 'Эффективный подбор преподавателя',
    description:
      'Разработка программы обучения под цели и задачи каждого конкретного ученика',
    icon: '/icons/vypusknik_eql1dsj2k4sg_512.png',
  },
  {
    title: 'Абсолютно прозрачные расчёты',
    description:
      'В личном кабинете пользователя отображается подробная финансовая статистика',
    icon: '/icons/oplata_za_klik_u1p3qr3x353u_512.png',
  },
  {
    title: 'Оперативная техническая поддержка',
    description:
      'Служба поддержки гарантированно решает проблемы в течение 24 часов',
    icon: '/icons/podderzhka_38x211knylwo_512.png',
  },
  {
    title: '100% гарантия качества обучения',
    description:
      'Если вам не понравился урок, мы оперативно заменим вам преподавателя и возместим денежные средства',
    icon: '/icons/garantiya_y431tkiqwvbh_512.png',
  },
];

// Data for steps explaining how the service works.
const steps = [
  {
    number: '01',
    title: 'Выбираете преподавателя',
    description:
      'Используйте фильтры по предметам, цене и рейтингу, чтобы найти идеального учителя.',
  },
  {
    number: '02',
    title: 'Назначаете урок',
    description:
      'Обговариваете с преподавателем дату и время занятия и подтверждаете бронь.',
  },
  {
    number: '03',
    title: 'Получаете результат',
    description:
      'Учитесь онлайн и отслеживаете прогресс в личном кабинете, занимаясь из любой точки мира.',
  },
];

// Testimonials content.  In production these could come from an API.
const testimonials = [
  {
    quote:
      'Благодаря SkypeSchool я наконец‑то выучила английский язык! Очень удобный сервис и замечательные преподаватели.',
    author: 'Анна, студентка',
  },
  {
    quote:
      'Готовился к ЕГЭ по математике, сервис помог подобрать идеального репетитора. Сдал на высокие баллы!',
    author: 'Дмитрий, школьник',
  },
  {
    quote:
      'Скайп‑уроки по гитаре — это находка! Занимаюсь в удобное время и уже вижу прогресс.',
    author: 'Елена, маркетолог',
  },
];

export default function HomePage() {
  const [trialOpen, setTrialOpen] = useState(false);
  return (
    <main>
      {/* Hero section */}
      <section className={styles.hero}>
        <div className="container">
          <h1 className={styles.heroTitle}>Найдите преподавателя онлайн</h1>
          <p className={styles.heroSubtitle}>
            Уроки по Skype, Viber, Whatsapp и другим удобным мессенджерам
          </p>
          {/* The form is purely decorative here and does not submit; event handlers
              are not allowed on server components. */}
          <form className={styles.searchForm}>
            <SubjectSearch className={styles.searchInput} />
            <button type="submit" className={styles.searchButton}>
              Найти
            </button>
          </form>
          <p className={styles.heroSubtext}>Более 5&nbsp;000 проверенных преподавателей</p>
        </div>
      </section>

      {/* Categories */}
      <section className={styles.categories}>
        <div className="container">
          <h2>Самые популярные уроки</h2>
          <div className={styles.categoriesGrid}>
            {categories.map((c) => (
              <Link key={c.title} href={`/teachers?q=${encodeURIComponent(c.title)}`} className={styles.categoryItem}>
                <div className={styles.categoryIcon}>
                  <Image src={c.icon} alt={c.alt} width={60} height={60} />
                </div>
                <h3 className={styles.categoryTitle}>{c.title}</h3>
              </Link>
            ))}
            <Link href="/teachers" className={styles.categoryItem}>
              <h3 className={styles.categoryTitle}>Посмотреть все предметы</h3>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className={styles.features}>
        <div className="container">
          <h2>Почему выбирают нас</h2>
          <div className={styles.featuresGrid}>
            {features.map((feature, idx) => (
              <div key={idx} className={styles.featureItem}>
                <Image src={feature.icon} alt={feature.title} width={60} height={60} />
                <div className={styles.featureTitle}>{feature.title}</div>
                <div className={styles.featureDescription}>{feature.description}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Free trial call to action */}
      <section className={styles.trial}>
        <div className="container">
          <div className={styles.trialGrid}>
            {/* Левая колонка — картинка */}
            <div className={styles.trialImage}>
              <Image
                src="/trial-hero.jpg"   // положи файл в /public/images/trial-hero.jpg
                alt="Пробный урок онлайн"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            </div>

            {/* Правая колонка — текст и кнопки */}
            <div className={styles.trialContent}>
              <h2>Бесплатный пробный урок</h2>
              <p>Попробуйте себя на первом занятии и убедитесь в удобстве онлайн-обучения.</p>
              <div className={styles.trialButtons}>
                <Link className={`${styles.trialButton} ${styles.primary}`} href="/teachers">
                  Выбрать преподавателя
                </Link>
                <button
                  className={`${styles.trialButton} ${styles.secondary}`}
                  onClick={() => setTrialOpen(true)}
                >
                  Оставить заявку
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Модалка */}
        <TrialRequestModal open={trialOpen} onClose={() => setTrialOpen(false)} />
      </section>


      {/* Steps explanation */}
      <section className={styles.steps}>
        <div className="container">
          <h2>Как это работает</h2>
          <div className={styles.stepsGrid}>
            {steps.map((step, idx) => (
              <div key={idx} className={styles.stepItem}>
                <div className={styles.stepNumber}>{step.number}</div>
                <div className={styles.stepTitle}>{step.title}</div>
                <div className={styles.stepDescription}>{step.description}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className={styles.testimonials}>
        <div className="container">
          <h2>Отзывы наших учеников</h2>
          {/* Testimonials slider lives in a client component */}
          <TestimonialsSlider testimonials={testimonials} />
        </div>
      </section>

      {/* Footer */}
    </main>
  );
}