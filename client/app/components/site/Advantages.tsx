export default function Advantages() {
  const items = [
    { title: "Гибкий график занятий", text: "Занимайтесь в удобное время по договорённости с преподавателем" },
    { title: "Эффективный подбор преподавателя", text: "Программа под ваши цели и задачи" },
    { title: "Прозрачные расчёты", text: "Детальная финансовая статистика в личном кабинете" },
    { title: "Поддержка 24/7", text: "Решаем технические вопросы в течение 24 часов" },
    { title: "Гарантия качества", text: "Не понравился урок — заменим преподавателя и вернём деньги" },
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4">
        <p className="text-gray-300 text-4xl font-bold select-none">02</p>
        <h2 className="mt-2 text-2xl md:text-3xl font-semibold">Почему выбирают нас</h2>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((i) => (
            <div key={i.title} className="rounded-2xl bg-white p-6 border">
              <h3 className="text-lg font-semibold">{i.title}</h3>
              <p className="mt-2 text-sm text-gray-600">{i.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
