export type Step = { id: string; num: string; title: string; text: string; image: string };
export const steps: Step[] = [
  { id: "h1", num: "01", title: "Выбирайте преподавателей по 80+ направлениям", text: "Сортируйте по стоимости, смотрите профили с аудио и видео.", image: "/legacy/home_assets/how-01.jpg" },
  { id: "h2", num: "02", title: "Знакомьтесь на бесплатных вводных уроках", text: "Познакомьтесь и выберите «своего» преподавателя.", image: "/legacy/home_assets/how-02.jpg" },
  { id: "h3", num: "03", title: "Оплачивайте удобным способом", text: "Карты, электронные деньги, переводы — как вам удобно.", image: "/legacy/home_assets/how-03.jpg" },
];

export type HowItem = {
  id: string;
  number: string;
  title: string;
  text: string;
  image: string;   // путь в /public
  href?: string;
};

export const howItems: HowItem[] = [
  {
    id: "how-1",
    number: "01",
    title: "Выбирайте преподавателей по >80 направлениям",
    text:
      "Знакомьтесь с профилями учителей, смотрите и слушайте их презентации — находите лучшего!",
    image: "/legacy/home_assets/380dcb231831f00_570x354.jpg",
    href: "/",
  },
  {
    id: "how-2",
    number: "02",
    title: "Бесплатные вводные уроки",
    text:
      "Проверьте формат и подачу, чтобы выбрать «своего» преподавателя без риска.",
    image: "/legacy/home_assets/a3043563159d63d_570x354.jpg",
    href: "/",
  },
  {
    id: "how-3",
    number: "03",
    title: "Моментальная оплата любым удобным способом",
    text:
      "Карта, электронные кошельки, переводы — всё прозрачно и быстро.",
    image: "/legacy/home_assets/ec01926772815d0_570x354.jpg",
    href: "/",
  },
];

export default howItems;
