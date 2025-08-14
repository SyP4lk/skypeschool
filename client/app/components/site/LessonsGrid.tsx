import Link from "next/link";

type Lesson = {
  title: string;
  price: string;
  href: string;
};

const lessons: Lesson[] = [
  { title: "Английский общий курс", price: "от 500 ₽ / урок", href: "/lesson/anglijskij-obshhij-kurs" },
  { title: "Высшая математика", price: "от 2000 ₽ / урок", href: "/lesson/vysshaya-matematika" },
  { title: "Русский язык. ЕГЭ", price: "от 600 ₽ / урок", href: "/lesson/russkij-yazyk-ege" },
  { title: "Физика для школьников", price: "от 560 ₽ / урок", href: "/lesson/fizika-dlya-shkolnikov" },
  { title: "Подготовка к TOEFL", price: "от 499 ₽ / урок", href: "/lesson/podgotovka-k-toefl" },
  { title: "Шахматы детям", price: "от 650 ₽ / урок", href: "/lesson/shahmaty-detyam" },
  { title: "Детский логопед", price: "от 1700 ₽ / урок", href: "/lesson/detskij-logoped" },
  { title: "Рисунок и живопись", price: "от 1350 ₽ / урок", href: "/lesson/risunok-i-zhivopis" },
  { title: "Китайский язык", price: "от 900 ₽ / урок", href: "/lesson/kitajskij-yazyk" },
  { title: "Подготовка к Swedex", price: "от 900 ₽ / урок", href: "/lesson/podgotovka-k-swedex" },
  { title: "Информатика ЕГЭ ОГЭ", price: "от 800 ₽ / урок", href: "/lesson/informatika-ege-oge" },
];

export default function LessonsGrid() {
  return (
    <section className="py-16 bg-white" id="block-lessons">
      <div className="mx-auto max-w-7xl px-4">
        <p className="text-gray-300 text-4xl font-bold select-none">01</p>
        <h2 className="mt-2 text-2xl md:text-3xl font-semibold">Самые популярные уроки</h2>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {lessons.map((l) => (
            <Link
              key={l.title}
              href={l.href}
              className="group rounded-xl border bg-white p-4 hover:shadow-md transition-shadow"
            >
              <h3 className="text-base font-semibold group-hover:text-blue-700">{l.title}</h3>
              <p className="mt-1 text-sm text-gray-500">{l.price}</p>
            </Link>
          ))}
          <Link
            href="/all-teachers"
            className="rounded-xl border-dashed border-2 p-4 flex flex-col items-start justify-center hover:border-blue-600"
          >
            <h3 className="text-base font-semibold">Смотреть все предметы</h3>
            <p className="mt-1 text-sm text-gray-500">Более 80 направлений</p>
          </Link>
        </div>
      </div>
    </section>
  );
}
