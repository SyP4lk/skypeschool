'use client';

import { useMemo, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import TrialRequestModal from '../../components/TrialRequestModal';

const API = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api').replace(/\/+$/, '');
const ORIGIN = API.replace(/\/api$/, '');
const toAbs = (p?: string | null) => (!p ? null : p.startsWith('http') ? p : `${ORIGIN}${p.startsWith('/') ? '' : '/'}${p}`);

export type TeacherSubject = { id?: string; subjectId?: string; name: string; price?: number | null; duration?: number | null };
export type TeacherProfileDTO = {
  id: string;
  photo?: string | null;
  aboutShort?: string | null;
  user?: { firstName?: string | null; lastName?: string | null; login?: string | null } | null;
  teacherSubjects?: TeacherSubject[] | null;
};

type Category = { id: string; name: string };
type Subject = { id: string; name: string; minPrice?: number | null; minDuration?: number | null };

export default function TeachersClient({
  data,
  categories,
  subjects,
  initialFilters,
}: {
  data: TeacherProfileDTO[];
  categories: Category[];
  subjects: Subject[];
  initialFilters: { categoryId: string; subjectId: string; sort: string };
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [categoryId, setCategory] = useState(initialFilters.categoryId);
  const [subjectId, setSubject] = useState(initialFilters.subjectId);
  const [sort, setSort] = useState(initialFilters.sort);

  const submit = () => {
    const qs = new URLSearchParams();
    if (categoryId) qs.set('categoryId', categoryId);
    if (subjectId) qs.set('subjectId', subjectId);
    if (sort) qs.set('sort', sort);
    router.replace(`${pathname}${qs.toString() ? `?${qs}` : ''}`);
  };

  const [trialOpen, setTrialOpen] = useState(false);

  return (
    <main className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-xl font-semibold mb-3">Найти преподавателя</h1>

      {/* Фильтры */}
      <div className="flex flex-wrap gap-3 items-center rounded-lg border bg-white p-3">
        <select value={categoryId} onChange={(e) => setCategory(e.target.value)} className="h-10 rounded border px-3">
          <option value="">Все категории</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <select value={subjectId} onChange={(e) => setSubject(e.target.value)} className="h-10 rounded border px-3">
          <option value="">Все предметы</option>
          {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>

        <select value={sort} onChange={(e) => setSort(e.target.value)} className="h-10 rounded border px-3">
          <option value="">Без сортировки</option>
          <option value="priceAsc">Сначала дешевле</option>
          <option value="priceDesc">Сначала дороже</option>
        </select>

        <button onClick={submit} className="ml-auto h-10 rounded bg-black px-4 text-white">Показать</button>
      </div>

      {/* Список */}
      <ul className="mt-4 grid gap-6 md:grid-cols-2">
        {data.map((t) => <TeacherCard key={t.id} t={t} onTrial={() => setTrialOpen(true)} />)}
        {data.length === 0 && <div className="text-gray-600">Список пуст</div>}
      </ul>

      <TrialRequestModal open={trialOpen} onClose={() => setTrialOpen(false)} />
    </main>
  );
}

function TeacherCard({ t, onTrial }: { t: TeacherProfileDTO; onTrial: () => void }) {
  const name = useMemo(() => {
    const fn = t.user?.firstName?.trim() ?? '';
    const ln = t.user?.lastName?.trim() ?? '';
    const login = t.user?.login?.trim() ?? '';
    return (fn || ln) ? `${fn} ${ln}`.trim() : (login || 'Преподаватель');
  }, [t]);

  const photoUrl = toAbs(t.photo);
  const about = t.aboutShort?.trim();
  const chips = (t.teacherSubjects || []).map(s => s.name).filter(Boolean);
  const minPrice = (() => {
    const vals = (t.teacherSubjects || []).map(s => (typeof s.price === 'number' ? s.price! : Infinity));
    const v = Math.min(...(vals.length ? vals : [Infinity]));
    return Number.isFinite(v) ? v : null;
  })();

  return (
    <li className="rounded-xl border bg-white p-4">
      <div className="flex gap-4 items-start">
        <div className="h-14 w-14 rounded-full bg-gray-100 overflow-hidden">
          {photoUrl
            ? <img src={photoUrl} alt={name} className="h-full w-full object-cover" width={56} height={56} loading="lazy" decoding="async" />
            : <div className="grid h-full w-full place-items-center text-xl">🧑‍🏫</div>}
        </div>

        <div className="flex-1">
          <div className="font-semibold">{name}</div>
          {about && <div className="text-sm text-gray-600 mt-1 line-clamp-2">{about}</div>}

          {chips.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {chips.map((c, i) => <span key={i} className="text-xs px-2 py-1 rounded-full bg-gray-100">{c}</span>)}
            </div>
          )}

          <div className="mt-3 flex gap-2">
            <a href={`/teacher/${t.id}`} className="px-3 py-1.5 rounded bg-black text-white text-sm hover:opacity-90">Страница преподавателя</a>
            <button onClick={onTrial} className="px-3 py-1.5 rounded border text-sm hover:bg-black hover:text-white">Бесплатный урок</button>
            {minPrice !== null && <div className="ml-auto text-sm text-gray-600">от {minPrice} ₽</div>}
          </div>
        </div>
      </div>
    </li>
  );
}
