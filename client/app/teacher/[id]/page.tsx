const API = '/api';
const fmtMoney = new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' });
const ORIGIN = API.replace(/\/api$/, '');
const toAbs = (p?: string | null) => (!p ? null : p.startsWith('http') ? p : `${ORIGIN}${p.startsWith('/') ? '' : '/'}${p}`);

type TeacherDTO = {
  id: string;
  user?: { firstName?: string | null; lastName?: string | null; login?: string | null } | null;
  photo?: string | null;
  aboutShort?: string | null;
  aboutFull?: string | null;
  teacherSubjects?: Array<{
    subject?: { id: string; name: string } | null;
    subjectId?: string | null;
    price?: number | null;
    duration?: number | null;
  }> | null;
};

type Props = { params: Promise<{ id: string }> };

export default async function Page({ params }: Props) {
  const { id } = await params;

  const r = await fetch(`${API}/teachers/${encodeURIComponent(id)}`, { cache: 'no-store' });
  if (!r.ok) {
    return (
      <main className="container py-12">
        <h1 className="text-2xl font-bold">Преподаватель не найден</h1>
        <p className="mt-2 text-gray-600">Проверьте ссылку или вернитесь к списку преподавателей.</p>
      </main>
    );
  }

  const data: TeacherDTO = await r.json();

  const name = (() => {
    const fn = data.user?.firstName?.trim() || '';
    const ln = data.user?.lastName?.trim() || '';
    if (fn || ln) return `${fn} ${ln}`.trim();
    return data.user?.login || 'Преподаватель';
  })();

  const avatarUrl = toAbs(data.photo);
  const about = data.aboutFull?.trim() || data.aboutShort?.trim() || '';

  // Загружаем публичные цены для каждого предмета
  const priceMap = Object.create(null) as Record<string, number>;
  await Promise.all((data.teacherSubjects || []).map(async (ts) => {
    const sid = ts.subject?.id || ts.subjectId || '';
    if (!sid) return;
    try {
      const r = await fetch(`${API}/pricing/resolve?teacherId=${encodeURIComponent(data.id)}&subjectId=${encodeURIComponent(sid)}`, { cache: 'no-store', credentials: 'include' });
      const j = await r.json().catch(() => ({}));
      const kop = Number(j?.item?.publicPrice || 0);
      if (kop > 0) priceMap[sid] = kop;
    } catch {}
  }));

  const subjects = (data.teacherSubjects || [])
    .map((ts) => ({
      id: ts.subject?.id || ts.subjectId || '',
      name: ts.subject?.name || '',
      price: typeof ts.price === 'number' ? ts.price : null,
      publicKop: priceMap[ts.subject?.id || ts.subjectId || ''] || null,
      duration: typeof ts.duration === 'number' ? ts.duration : null,
    }))
    .filter((s) => s.id && s.name);

  return (
    <main className="container py-8">
      <div className="flex items-start gap-6">
        {avatarUrl && (
          <img
            src={avatarUrl}
            alt={name}
            className="h-36 w-36 rounded-xl border object-cover"
            width={144}
            height={144}
            loading="lazy"
            decoding="async"
          />
        )}
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{name}</h1>
          {about && <p className="mt-3 whitespace-pre-line text-gray-700">{about}</p>}
        </div>
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-xl font-semibold">Предметы и стоимость</h2>
        {subjects.length > 0 ? (
          <ul className="grid gap-2">
            {subjects.map((s) => (
              <li key={s.id} className="flex items-center justify-between rounded border px-3 py-2">
                <span>{s.name}</span>
                <span className="text-sm text-gray-600">
                  {s.duration ? `${s.duration} мин` : ''} {s.publicKop ? `· ${fmtMoney.format(s.publicKop/100)}` : (s.price ? `· ${fmtMoney.format(Number(s.price)/100)}` : '')}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-gray-500">Нет предметов</div>
        )}
      </section>

      <div className="mt-8">
        <a href="/teachers" className="text-blue-600 hover:underline">← Все преподаватели</a>
      </div>
    </main>
  );
}
