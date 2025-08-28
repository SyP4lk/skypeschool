'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import TrialRequestModal from '../../components/TrialRequestModal';

const API = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api').replace(/\/+$/, '');
const ORIGIN = API.replace(/\/api$/, '');
const toAbs = (p?: string | null) =>
  !p ? null : p.startsWith('http') ? p : `${ORIGIN}${p.startsWith('/') ? '' : '/'}${p}`;

export type TeacherSubject = {
  id?: string;
  subjectId?: string;
  name: string;
  price?: number | null;
  duration?: number | null;
};

export type TeacherProfileDTO = {
  id: string;
  photo?: string | null;
  aboutShort?: string | null;
  user?: { firstName?: string | null; lastName?: string | null; login?: string | null } | null;
  teacherSubjects?: TeacherSubject[] | null;
};

type Category = { id: string; name: string };
/** На бэке, как правило, у subject есть categoryId — учитываем, но не требуем. */
type Subject = { id: string; name: string; categoryId?: string | null; minPrice?: number | null; minDuration?: number | null };

type Init = { categoryId: string; subjectId: string; sort: string; price: string };

const PRICE_OPTIONS = [
  { v: '', label: 'Стоимость: не выбрано' },
  { v: 'lt500', label: 'до 500 ₽' },
  { v: 'lt1000', label: 'до 1000 ₽' },
  { v: 'lt1500', label: 'до 1500 ₽' },
  { v: 'lt2000', label: 'до 2000 ₽' },
  { v: 'gte2000', label: 'от 2000 ₽' },
];

export default function TeachersClient({
  data,
  categories,
  subjects,
  initialFilters,
}: {
  data: TeacherProfileDTO[];
  categories: Category[];
  subjects: Subject[];
  initialFilters: Init;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [categoryId, setCategory] = useState(initialFilters.categoryId);
  const [subjectId, setSubject] = useState(initialFilters.subjectId);
  const [sort, setSort] = useState(initialFilters.sort);
  const [price, setPrice] = useState(initialFilters.price);
  const [trialOpen, setTrialOpen] = useState(false);

  // ---- Фильтрация перечня предметов по выбранной категории ----
  const filteredSubjects: Subject[] = useMemo(() => {
    // если у предметов нет categoryId — отдаём все (в бэке может не прийти поле)
    const hasCategoryField = subjects.some((s) => s.categoryId);
    if (!categoryId || !hasCategoryField) return subjects;
    return subjects.filter((s) => s.categoryId === categoryId);
  }, [subjects, categoryId]);

  // Если текущий subject не входит в выбранную категорию — сбрасываем его
  useEffect(() => {
    if (!subjectId) return;
    if (!filteredSubjects.find((s) => s.id === subjectId)) {
      setSubject('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId, filteredSubjects.length]);

  // ---- Автоприменение фильтров: меняем URL + принудительно освежаем данные страницы ----
  const lastSearchRef = useRef<string>('');
  useEffect(() => {
    const qs = new URLSearchParams();
    if (categoryId) qs.set('categoryId', categoryId);
    if (subjectId) qs.set('subjectId', subjectId);
    if (sort) qs.set('sort', sort);
    if (price) qs.set('price', price);

    const nextSearch = qs.toString();
    // избегаем пустых лишних навигаций
    const current = typeof window !== 'undefined' ? window.location.search.replace(/^\?/, '') : '';
    if (nextSearch === current) return;
    if (nextSearch === lastSearchRef.current) return;

    lastSearchRef.current = nextSearch;
    const url = `${pathname}${nextSearch ? `?${nextSearch}` : ''}`;

    router.replace(url, { scroll: false });
    // принудительно перерисовать серверный компонент (обновит список с бэка)
    router.refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId, subjectId, sort, price]);

  // ---- Клиентская фильтрация по цене (остальное — с сервера) ----
  const view = useMemo(() => {
    const minPrice = (t: TeacherProfileDTO) => {
      const vals = (t.teacherSubjects || []).map((s) => (typeof s.price === 'number' ? s.price! : Infinity));
      const v = Math.min(...(vals.length ? vals : [Infinity]));
      return Number.isFinite(v) ? v : null;
    };
    if (!price) return data;
    return data.filter((t) => {
      const p = minPrice(t);
      if (p == null) return false;
      if (price === 'lt500') return p < 500;
      if (price === 'lt1000') return p < 1000;
      if (price === 'lt1500') return p < 1500;
      if (price === 'lt2000') return p < 2000;
      if (price === 'gte2000') return p >= 2000;
      return true;
    });
  }, [data, price]);

  return (
    <main className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-xl font-semibold mb-3">Найти преподавателя</h1>

      {/* Фильтры */}
      <div className="flex flex-wrap gap-3 items-center rounded-lg border bg-white p-3">
        <select
          value={categoryId}
          onChange={(e) => setCategory(e.target.value)}
          className="h-10 rounded border px-3"
        >
          <option value="">Все категории</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={subjectId}
          onChange={(e) => setSubject(e.target.value)}
          className="h-10 rounded border px-3"
        >
          <option value="">Все предметы</option>
          {filteredSubjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="h-10 rounded border px-3"
        >
          <option value="">Без сортировки</option>
          <option value="priceAsc">Сначала дешевле</option>
          <option value="priceDesc">Сначала дороже</option>
        </select>

        <select
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="h-10 rounded border px-3"
        >
          {PRICE_OPTIONS.map((o) => (
            <option key={o.v} value={o.v}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* Список */}
      <ul className="mt-4 grid gap-6 md:grid-cols-2">
        {view.map((t) => (
          <TeacherCard key={t.id} t={t} onTrial={() => setTrialOpen(true)} />
        ))}
        {view.length === 0 && <div className="text-gray-600">Список пуст</div>}
      </ul>

      <TrialRequestModal open={trialOpen} onClose={() => setTrialOpen(false)} />
    </main>
  );
}

function TeacherCard({ t, onTrial }: { t: TeacherProfileDTO; onTrial: () => void }) {
  const name = (() => {
    const fn = t.user?.firstName?.trim() ?? '';
    const ln = t.user?.lastName?.trim() ?? '';
    const login = t.user?.login?.trim() ?? '';
    return fn || ln ? `${fn} ${ln}`.trim() : login || 'Преподаватель';
  })();

  const photoUrl = toAbs(t.photo);
  const about = t.aboutShort?.trim();
  const chips = (t.teacherSubjects || []).map((s) => s.name).filter(Boolean);
  const minPrice = (() => {
    const vals = (t.teacherSubjects || []).map((s) => (typeof s.price === 'number' ? s.price! : Infinity));
    const v = Math.min(...(vals.length ? vals : [Infinity]));
    return Number.isFinite(v) ? v : null;
  })();

  return (
    <li className="rounded-xl border bg-white p-4">
      <div className="flex gap-4 items-start">
        <div className="h-14 w-14 rounded-full bg-gray-100 overflow-hidden">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={name}
              className="h-full w-full object-cover"
              width={56}
              height={56}
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="grid h-full w-full place-items-center text-xl">🧑‍🏫</div>
          )}
        </div>

        <div className="flex-1">
          <div className="font-semibold" style={{ color: 'var(--colour-text)' }}>
            {name}
          </div>
          {about && (
            <div className="text-sm mt-1 line-clamp-2" style={{ color: 'var(--colour-text)' }}>
              {about}
            </div>
          )}

          {chips.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {chips.map((c, i) => (
                <span
                  key={i}
                  className="text-xs px-2 py-1 rounded-full"
                  style={{ background: '#f1f3f5', color: 'var(--colour-text)' }}
                >
                  {c}
                </span>
              ))}
            </div>
          )}

          <div className="mt-3 flex gap-2 items-center">
            <a
              href={`/teacher/${t.id}`}
              className="px-3 py-1.5 rounded text-white text-sm hover:opacity-90"
              style={{ backgroundColor: 'var(--colour-secondary)' }}
            >
              Страница преподавателя
            </a>
            <button
              onClick={onTrial}
              className="px-3 py-1.5 rounded border text-sm hover:opacity-90"
              style={{ borderColor: 'var(--colour-primary)', color: 'var(--colour-primary)' }}
            >
              Бесплатный урок
            </button>
            {minPrice !== null && (
              <div className="ml-auto text-sm" style={{ color: 'var(--colour-text)' }}>
                от {minPrice} ₽
              </div>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}
