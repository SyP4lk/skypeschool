import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative">
      <div className="relative w-full h-[360px] md:h-[420px] lg:h-[520px]">
        <img
          src="/legacy/home_assets/0cd7ef469757582_1920x563.jpg"
          alt="Hero"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative h-full mx-auto max-w-7xl px-4 flex flex-col justify-center">
          <h1 className="text-white text-2xl md:text-4xl lg:text-5xl font-semibold max-w-3xl">
            Найдите своего преподавателя и начните заниматься прямо сейчас
          </h1>
          <div className="mt-6 flex gap-3">
            <Link
              href="/all-teachers"
              className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg px-5 py-3 text-sm font-medium transition-colors"
            >
              Выбрать преподавателя
            </Link>
            <Link
              href="/#free-trial"
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
