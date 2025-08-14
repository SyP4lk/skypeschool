// Серверный компонент (без 'use client')
import { notFound } from 'next/navigation';

const API = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api').replace(/\/+$/, '');
const API_ORIGIN = API.replace(/\/api$/, '');

type TeacherSubject = {
  price: number;           // копейки/рубли — как в API
  duration: number;        // минуты
  subject: { id: string; name: string; categoryId?: string };
};

type TeacherData = {
  id: string;
  photo?: string | null;
  aboutShort?: string | null;
  aboutFull?: string | null;
  education?: string | null;
  isActive?: boolean;
  user: { id: string; login: string; firstName?: string | null; lastName?: string | null };
  teacherSubjects?: TeacherSubject[];
};

async function getTeacher(id: string): Promise<TeacherData | null> {
  const res = await fetch(`${API}/teacher/${id}`, {
    // чтобы всегда получать актуальные данные
    cache: 'no-store',
    // если нужен ISR — можно так:
    // next: { revalidate: 60 },
  });
  if (!res.ok) return null;
  return res.json();
}

function photoUrl(src?: string | null): string {
  if (!src) return '';
  if (src.startsWith('http')) return src;
  if (src.startsWith('/')) return `${API_ORIGIN}${src}`;
  return `${API_ORIGIN}/uploads/${src}`;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getTeacher(id);
  const fullName =
    [t?.user?.firstName, t?.user?.lastName].filter(Boolean).join(' ').trim() ||
    t?.user?.login ||
    'Преподаватель';

  return {
    title: `${fullName} — SkypeSchool`,
    description: t?.aboutShort || undefined,
  };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getTeacher(id);
  if (!data) notFound();

  const fullName =
    [data.user?.firstName, data.user?.lastName].filter(Boolean).join(' ').trim() ||
    data.user?.login ||
    'Преподаватель';

  // самая дешёвая связка по предметам
  const cheapest = (data.teacherSubjects || []).slice().sort((a, b) => (a.price ?? 0) - (b.price ?? 0))[0];
  const priceFrom = cheapest ? (cheapest.price / 100).toFixed(0) : undefined;
  const duration = cheapest?.duration;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Шапка карточки */}
      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6 items-start">
        {/* Фото */}
        <div className="w-[220px] h-[220px] rounded-2xl overflow-hidden bg-gray-100 mx-auto md:mx-0">
          {data.photo ? (
            // Next/Image можно подключить по желанию; здесь <img> для простоты
            <img
              src={photoUrl(data.photo)}
              alt={fullName}
              className="w-full h-full object-cover"
              loading="eager"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">Нет фото</div>
          )}
        </div>

        {/* Основная инфа */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{fullName}</h1>
          {data.aboutShort && <p className="mt-2 text-gray-700">{data.aboutShort}</p>}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            {priceFrom && (
              <div className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 px-3 py-1 text-sm">
                от {priceFrom} ₽{duration ? ` за 1 урок (${duration} мин)` : ''}
              </div>
            )}
            {data.isActive === false && (
              <div className="inline-flex items-center rounded-full bg-rose-50 text-rose-700 px-3 py-1 text-sm">
                Временно недоступен
              </div>
            )}
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              className="rounded-xl px-4 py-2 bg-sky-600 text-white hover:bg-sky-700"
              // TODO: открыть TrialRequestModal
              onClick={() => alert('Модалка пробного урока (в разработке)')}
            >
              Пробный урок
            </button>
            <button
              type="button"
              className="rounded-xl px-4 py-2 border border-gray-300 hover:bg-gray-50"
              // TODO: начать запись на урок
              onClick={() => alert('Запись на урок (в разработке)')}
            >
              Записаться
            </button>
          </div>
        </div>
      </div>

      {/* Подробности */}
      <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
        <section className="md:col-span-2">
          {data.aboutFull && (
            <>
              <h2 className="text-xl font-semibold mb-2">О преподавателе</h2>
              <div className="prose max-w-none text-gray-800">{data.aboutFull}</div>
            </>
          )}

          {data.teacherSubjects && data.teacherSubjects.length > 0 && (
            <>
              <h2 className="text-xl font-semibold mt-8 mb-2">Предметы и цены</h2>
              <ul className="divide-y border rounded-xl">
                {data.teacherSubjects.map((ts, i) => (
                  <li key={i} className="p-3 flex items-center justify-between">
                    <div className="text-gray-800">{ts.subject?.name}</div>
                    <div className="text-gray-600">
                      {(ts.price / 100).toFixed(0)} ₽{ts.duration ? ` · ${ts.duration} мин` : ''}
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        <aside>
          {data.education && (
            <div className="rounded-xl border p-4">
              <h3 className="font-semibold mb-2">Образование</h3>
              <div className="text-gray-700 whitespace-pre-line">{data.education}</div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
