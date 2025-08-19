import { steps } from "@/data/how";

export default function HowItWorks() {
  return (
    <section className="py-14 md:py-20 bg-white">
      <div className="container-fluid">
        <span className="section-number">04</span>
        <h2 className="mt-2 md:-mt-8 text-2xl md:text-3xl font-bold">Как работает Skype School</h2>
        <p className="mt-3 text-gray-600 max-w-3xl">
          Простая и современная платформа для дистанционного обучения. Прозрачный и понятный алгоритм.
        </p>
        <ul className="mt-8 grid md:grid-cols-3 gap-8">
          {steps.map(s => (
            <li key={s.id} className="rounded-2xl overflow-hidden border bg-white">
              <img src={s.image} alt="" className="w-full h-44 md:h-56 object-cover" />
              <div className="p-5">
                <div className="text-sm text-gray-400 font-semibold">{s.num}</div>
                <h3 className="mt-1 font-semibold">{s.title}</h3>
                <p className="mt-2 text-gray-600">{s.text}</p>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-6 p-5 rounded-2xl bg-gray-50 border">
          <p className="text-gray-700">
            Ответы на частые вопросы вы найдёте в удобном <a className="underline" href="#">разделе FAQ</a>.
          </p>
        </div>
      </div>
    </section>
  );
}
