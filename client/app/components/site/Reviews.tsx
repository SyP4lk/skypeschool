import { reviewsData } from "@/data/reviews";

export default function Reviews() {
  return (
    <section className="py-14 md:py-20">
      <div className="container-fluid">
        <span className="section-number">05</span>
        <h2 className="mt-2 md:-mt-8 text-2xl md:text-3xl font-bold">Отзывы о нашей работе</h2>
        <div className="mt-8 grid md:grid-cols-3 gap-6">
          {reviewsData.map(r => (
            <article key={r.id} className="rounded-2xl border bg-white p-5">
              <div className="flex items-center gap-4">
                <img src="/legacy/home_assets/user_empty.svg" alt="" className="h-12 w-12" />
                <div>
                  <div className="font-semibold">{r.name}</div>
                  <div className="text-xs inline-flex items-center px-2 py-1 rounded bg-blue-100 text-blue-700">{r.role}</div>
                </div>
              </div>
              <p className="mt-4 text-gray-700">{r.short}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
