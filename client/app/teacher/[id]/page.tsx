// app/teacher/[id]/page.tsx
import Link from 'next/link';

type Teacher = {
  id: string;
  user?: {
    firstName?: string | null;
    lastName?: string | null;
    login?: string | null;
    avatar?: string | null;
  } | null;
  subjects?: Array<{
    id: string;
    name: string;
    price?: number | null;
    duration?: number | null;
  }> | null;
  bio?: string | null;
  photo?: string | null;
};

type Props = { params: Promise<{ id: string }> };

export default async function Page({ params }: Props) {
  const { id } = await params;

  const api = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '');
  const res = await fetch(`${api}/teacher/${encodeURIComponent(id)}`, { cache: 'no-store' });

  if (!res.ok) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Преподаватель не найден</h1>
        <Link className="underline text-sm" href="/teachers">← Вернуться к списку</Link>
      </main>
    );
  }

  const data: Teacher = await res.json();

  const name =
    (data?.user?.firstName || data?.user?.lastName)
      ? `${data.user?.firstName ?? ''} ${data.user?.lastName ?? ''}`.trim()
      : (data?.user?.login ?? 'Преподаватель');

  const avatar = data.photo || data.user?.avatar || null;

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-start gap-6">
        {avatar && (
          // инвариант: next/image только из /public → для /uploads обычный <img>
          <img src={avatar} alt={name} className="w-36 h-36 object-cover rounded-xl border" />
        )}
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{name}</h1>
          {data.bio && <p className="mt-3 text-gray-700 whitespace-pre-line">{data.bio}</p>}
        </div>
      </div>

      <section className="mt-8">
        <h2 className="text-xl font-semibold mb-3">Предметы и стоимость</h2>
        {data.subjects && data.subjects.length > 0 ? (
          <ul className="grid gap-3 sm:grid-cols-2">
            {data.subjects.map((s) => (
              <li key={s.id} className="border rounded p-3">
                <div className="font-medium">{s.name}</div>
                {(s.price ?? null) !== null && (s.duration ?? null) !== null && (
                  <div className="text-sm text-gray-600">от {s.price} ₽ ({s.duration} мин)</div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600">Информация о предметах будет добавлена позже.</p>
        )}
      </section>

      <div className="mt-8">
        <Link className="underline text-sm" href="/teachers">← Вернуться к списку</Link>
      </div>
    </main>
  );
}
