import Link from "next/link";

export default function FreeTrial() {
  return (
    <section className="py-16 bg-white" id="free-trial">
      <div className="mx-auto max-w-7xl px-4 grid lg:grid-cols-2 gap-8 items-center">
        <div>
          <img
            src="/legacy/home_assets/613e87b89fc22bc_960x605.jpg"
            alt="Free trial"
            className="w-full h-auto rounded-2xl object-cover"
          />
        </div>
        <div>
          <p className="text-gray-300 text-4xl font-bold select-none">03</p>
          <h2 className="mt-2 text-2xl md:text-3xl font-semibold">Бесплатный пробный урок</h2>
          <p className="mt-3 text-gray-600">
            Познакомьтесь с преподавателем и узнайте свой уровень на бесплатном 20‑минутном пробном уроке.
          </p>
          <div className="mt-6 flex gap-3">
            <Link
              href="/all-teachers"
              className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg px-5 py-3 text-sm font-medium transition-colors"
            >
              Выбрать преподавателя
            </Link>
            <Link
              href="/#contact"
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-5 py-3 text-sm font-medium transition-colors"
            >
              Оставить заявку
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
