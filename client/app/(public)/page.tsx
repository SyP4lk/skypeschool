'use client';
/*
 * Home page of the public site.
 * Оптимизированная версия:
 * — Ленивая отрисовка секции «Популярные уроки» (IntersectionObserver)
 * — Обложки карточек через next/image (нет opacity:0)
 * — Лёгкие анимации: DecorBlobs в Hero, AnimatedGrid под сеткой
 */

import dynamicClient from 'next/dynamic';
import styles from '../Home.module.css';
import SubjectSearch from '../components/SubjectSearch';
import Image from 'next/image';
import { useState } from 'react';
import TrialRequestModal from '../components/TrialRequestModal';
import Link from 'next/link';

import { Card, CardFooter, Button as HButton } from '@heroui/react';
import LazySection from '../components/LazySection';
import MouseRepelField from '../components/MouseRepelField';

export const dynamic = 'force-dynamic';

const TestimonialsSlider = dynamicClient(
  () => import('../components/TestimonialsSlider'),
  { ssr: false }
);

type Category = {
  title: string;
  icon: string; // путь до файла в /public
  alt: string;
};

const categories: Category[] = [
  { title: 'Английский общий курс',  icon: '/icons/thumbs/language-learning_7231672.webp', alt: 'Английский общий курс' },
  { title: 'Высшая математика',      icon: '/icons/mathematics.webp',        alt: 'Высшая математика' },
  { title: 'Русский язык ЕГЭ',       icon: '/icons/thumbs/premiere-rush_15584886.webp',    alt: 'Русский язык ЕГЭ' },
  { title: 'Физика для школьников',  icon: '/icons/thumbs/fizika_j5g6lotv576x_512.webp',   alt: 'Физика для школьников' },
  { title: 'Подготовка к TOEFL',     icon: '/icons/thumbs/toefl.webp',                      alt: 'Подготовка к TOEFL' },
  { title: 'Шахматы детям',          icon: '/icons/thumbs/strategiya_dq10c445olj4_512.webp',alt: 'Шахматы детям' },
  { title: 'Детский логопед',        icon: '/icons/thumbs/logopediya_032nkwn8jwck_512.webp',alt: 'Детский логопед' },
  { title: 'Немецкий язык',          icon: '/icons/thumbs/izucite-koncepciu-onlain-obrazovania-nemeckogo-azyka.jpg', alt: 'Рисунок и живопись' },
  { title: 'Китайский язык',         icon: '/icons/thumbs/kitaj_8bfrwpul7o2d_512.webp',     alt: 'Китайский язык' },
  { title: 'Информатика ЕГЭ ОГЭ',    icon: '/icons/thumbs/informatika_0c2itb0a3w01_512.webp',alt: 'Информатика ЕГЭ ОГЭ' },
];

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
    icon: '/icons/thumbs/vypusknik_eql1dsj2k4sg_512.png',
  },
  {
    title: 'Абсолютно прозрачные расчёты',
    description:
      'В личном кабинете пользователя отображается подробная финансовая статистика',
    icon: '/icons/thumbs/oplata_za_klik_u1p3qr3x353u_512.png',
  },
  {
    title: 'Оперативная техническая поддержка',
    description:
      'Служба поддержки гарантированно решает проблемы в течение 24 часов',
    icon: '/icons/thumbs/podderzhka_38x211knylwo_512.png',
  },
  {
    title: '100% гарантия качества обучения',
    description:
      'Если вам не понравился урок, мы оперативно заменим вам преподавателя и возместим денежные средства',
    icon: '/icons/thumbs/garantiya_y431tkiqwvbh_512.png',
  },
];

const steps = [
  {
    number: '1',
    title: 'Выбираете преподавателя',
    description:
      'Используйте фильтры по предметам, цене и рейтингу, чтобы найти идеального учителя.',
  },
  {
    number: '2',
    title: 'Назначаете урок',
    description:
      'Обговариваете с преподавателем дату и время занятия и подтверждаете бронь.',
  },
  {
    number: '3',
    title: 'Получаете результат',
    description:
      'Занимаясь из любой точки мира.',
  },
];

const testimonials = [
  {
    quote:
      'Благодаря SkypeSchool я наконец-то выучила английский язык! Очень удобный сервис и замечательные преподаватели.',
    author: 'Анна, студентка',
  },
  {
    quote:
      'Готовился к ЕГЭ по математике, сервис помог подобрать идеального репетитора. Сдал на высокие баллы!',
    author: 'Дмитрий, школьник',
  },
  {
    quote:
      'Скайп-уроки по гитаре — это находка! Занимаюсь в удобное время и уже вижу прогресс.',
    author: 'Елена, маркетолог',
  },
];

export default function HomePage() {
  const [trialOpen, setTrialOpen] = useState(false);

  return (
    <main>
      {/* Hero */}
      <section className={styles.hero}>
        
        <div className="container">
          <h1 className={styles.heroTitle} data-aos="fade-up" data-aos-offset="0">
            Найдите преподавателя онлайн
          </h1>
          <p className={styles.heroSubtitle} data-aos="fade-up" data-aos-delay="80" data-aos-offset="0">
            Уроки по Microsoft Teams, Zoom, Whatsapp, Discord, VK и другим удобным мессенджерам
          </p>

          <form className={styles.searchForm} data-aos="fade-up" data-aos-delay="140" data-aos-offset="0">
            <SubjectSearch className={styles.searchInput} />
            <button type="submit" className={styles.searchButton}>
              Найти
            </button>
          </form>

          <p className={styles.heroSubtext} data-aos="fade-up" data-aos-delay="200" data-aos-offset="0">
            Проверенные преподаватели — честные отзывы и пробный урок <br />
            Поможем «закрыть» пробелы и полюбить предмет
          </p>
        </div>
      </section>

<section className={styles.trial}>
        <div className="container">
          <div className={styles.trialGrid}>
            {/* Левая колонка — картинка с «ореолом» вокруг */}
            <div className={styles.trialImage} data-aos="fade-right">
              <Image
                src="/trial-hero.jpg"
                alt=""
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className={styles.trialImgBlur}
              />
              <Image
                src="/trial-hero.jpg"
                alt="Пробный урок онлайн"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className={styles.trialImgSharp}
              />
            </div>

            <div className={styles.trialContent} data-aos="fade-left" data-aos-delay={120}>
              <h2>Бесплатный пробный урок</h2>
              <p>Попробуйте себя на первом занятии и убедитесь в удобстве онлайн-обучения.</p>
              <div className={styles.trialButtons}>
                <Link className={`${styles.trialButton} ${styles.primary}`} href="/teachers">
                  Выбрать преподавателя
                </Link>
                <button
                  type="button" className={`${styles.trialButton} ${styles.secondary}`}
                  onClick={() => setTrialOpen(true)}
                >
                  Оставить заявку
                </button>
              </div>
            </div>
          </div>
        </div>

        <TrialRequestModal open={trialOpen} onClose={() => setTrialOpen(false)} />
      </section>



{/* Categories (lazy + particles background) */}
<section className={styles.categories} >
<MouseRepelField
        asBackground
        maxCount={150}              // верхняя граница; реально масштабируется от площади
        maxSpeed={0.75}
        linkDistance={130}
        lineWidth={1}
        lineColor="rgba(99,102,241,0.45)"  // indigo-500 @ 0.45
        pointSize={2}
        pointColor="rgba(59,130,246,0.9)"  // blue-500
        mouseRadius={130}
        mousePower={900}
        mouseMode="repel"          // 'repel' или 'attract'
      />
  <div className="container">
    
    <h2 data-aos="fade-up">Самые популярные уроки</h2>

    {/* wrapper с position:relative — якорь для фона */}
    <LazySection
      rootMargin="300px 0px"
      fallbackMinHeight={520}
      className="relative overflow-hidden rounded-2xl mt-4"
    >
      
  {/* Фон: частицы, не влияют на лейаут */}
      
      {/* Контент поверх фона */}
      <div className={`relative z-10 grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 ${styles.cvAuto}`}>
        {categories.map((c) => (
          <Card
  key={c.title}
  as={Link}
  prefetch={false}
  href={`/teachers?q=${encodeURIComponent(c.title)}`}
  isPressable
  isFooterBlurred
  radius="none"                            // управление радиусом берём на себя
  className="relative h-[260px] border-none rounded-2xl overflow-hidden shadow-sm"
>
  <div className="absolute inset-0 z-0">
    <Image
      alt={c.alt}
      src={c.icon}
      fill
      decoding="async"
      loading="lazy"
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
      className="object-cover"
    />
  </div>

  <CardFooter
    className="
      absolute bottom-2 left-2 right-2 z-10
      rounded-xl border bg-white/80 dark:bg-black/50
      backdrop-blur-[3px] shadow-small
      py-1
      border-white/30 dark:border-white/10
    "
  >
    <p className="text-tiny text-foreground">{c.title}</p>
    <HButton
      as="span"
      className="text-tiny text-foreground/90 bg-black/20 dark:bg-white/15"
      color="default"
      radius="lg"
      size="sm"
      variant="flat"
    >
      Перейти
    </HButton>
  </CardFooter>
</Card>

        ))}
      </div>
    </LazySection>
  </div>
</section>


      {/* Features */}
      <section className={styles.features}>
        <div className="container">
          <h2>Почему выбирают нас</h2>
          <div className={styles.featuresGrid}>
            {features.map((feature, idx) => (
              <div key={idx} className={styles.featureItem} data-aos="fade-up" data-aos-delay={idx * 60}>
                <Image src={feature.icon} alt={feature.title} width={60} height={60} />
                <div className={styles.featureTitle}>{feature.title}</div>
                <div className={styles.featureDescription}>{feature.description}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Free trial call to action */}
      

      {/* Steps */}
      <section className={styles.steps}>
        <div className="container">
          <h2>Как это работает</h2>
          <div className={styles.stepsGrid}>
            {steps.map((step, idx) => (
              <div key={idx} className={styles.stepItem} data-aos="fade-up" data-aos-delay={idx * 70}>
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
          <TestimonialsSlider testimonials={testimonials} />
        </div>
      </section>
    </main>
  );
}
