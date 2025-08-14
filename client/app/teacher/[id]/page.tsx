export const dynamic = 'force-dynamic';

async function fetchTeacher(id: string) {
  const base = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/+$/, '');
  const r = await fetch(`${base}/teachers/${id}`, { cache: 'no-store' });
  if (!r.ok) throw new Error('Teacher not found');
  return r.json();
}

export default async function Page({ params }: { params: { id: string } }) {
  const data = await fetchTeacher(params.id);

  const name = (data?.user?.firstName || data?.user?.lastName)
    ? `${data.user.firstName ?? ''} ${data.user.lastName ?? ''}`.trim()
    : (data?.user?.login ? data.user.login : 'Преподаватель');

  const photo = (() => {
    const p: string = data?.photo ?? '';
    if (!p) return '';
    if (p.startsWith('http')) return p;
    if (p.startsWith('/')) return p;
    return `/uploads/${p}`;
  })();

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">{name}</h1>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-[200px,1fr]">
        <div>
          {photo ? (
            // Next/Image можно подключить позже; для SSR подойдёт <img>
            <img src={photo} alt={name} className="h-[200px] w-[200px] rounded-xl object-cover" />
          ) : (
            <div className="h-[200px] w-[200px] rounded-xl bg-slate-100" />
          )}
        </div>

        <div className="space-y-4">
          {data?.aboutShort && <p className="text-lg">{data.aboutShort}</p>}
          {data?.aboutFull && <p className="text-slate-700">{data.aboutFull}</p>}
          {data?.education && (
            <div className="rounded-xl border border-slate-200 p-4">
              <div className="mb-2 font-medium">Образование</div>
              <div className="text-slate-700">{data.education}</div>
            </div>
          )}

          {Array.isArray(data?.teacherSubjects) && data.teacherSubjects.length > 0 && (
            <div className="rounded-xl border border-slate-200 p-4">
              <div className="mb-2 font-medium">Предметы и цены</div>
              <ul className="space-y-2">
                {data.teacherSubjects.map((ts: any) => (
                  <li key={ts.id} className="flex items-center justify-between">
                    <span>{ts.subject?.name ?? 'Предмет'}</span>
                    <span className="text-slate-700">
                      от {ts.price} ₽ <span className="text-slate-500">за {ts.duration} мин</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-3">
            <button className="rounded-xl bg-blue-600 px-4 py-2 text-white">Пробный урок</button>
            <button className="rounded-xl border border-slate-300 px-4 py-2">Записаться</button>
          </div>
        </div>
      </div>
    </div>
  );
}
