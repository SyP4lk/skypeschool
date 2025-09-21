export type Review = {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  short: string;
  full?: string;
  social?: { fb?: string };
};

export const reviewsData: Review[] = [
  {
    id: "rev-inna",
    name: "Inna",
    role: "Путешественница",
    avatar: "/legacy/home_assets/user_empty.svg",
    short:
      "Марина — профи, умеет направить и дать нужные советы. С носителями языка вышло на новый уровень.",
    full:
      "Вместе укрепили грамматику, затем добавили занятия с носителями. В итоге успешно сдала IELTS.",
    social: { fb: "https://www.facebook.com/inna.buzyakova" },
  },
  {
    id: "rev-alex",
    name: "Александр",
    role: "Product Manager",
    avatar: "/legacy/home_assets/user_empty.svg",
    short:
      "Отличные преподаватели и гибкий график. Домашка стала привычкой, прогресс заметен.",
    full:
      "Формат онлайн экономит время и деньги, сервис прозрачен по оплатам — рекомендую.",
    social: { fb: "https://www.facebook.com/profile.php?id=100000964910962" },
  },
  {
    id: "rev-dinara",
    name: "Динара",
    role: "Директор",
    avatar: "/legacy/home_assets/user_empty.svg",
    short:
      "Спасибо за отлично подобранных преподавателей — дети успешно закрыли учебный год.",
    full:
      "Настя по русскому, Давид по физике, Виктория по математике — команда супер.",
    social: { fb: "https://www.facebook.com/dinara.temirtasheva" },
  },
  {
    id: "rev-ira",
    name: "Ира",
    role: "Студентка",
    avatar: "/legacy/home_assets/user_empty.svg",
    short:
      "Готовилась к IELTS в сжатые сроки — нашла «своего» преподавателя и получила нужный балл.",
    full:
      "Формат онлайн, индивидуальный подход и поддержка — всё сложилось.",
    social: { fb: "https://www.facebook.com/irina.skripnikova" },
  },
];

export default reviewsData;
