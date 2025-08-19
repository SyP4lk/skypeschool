'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import TrialRequestModal from '../../components/TrialRequestModal';

type Category = { id: string; name: string };
type Subject = {
  id: string;
  name: string;
  categoryId: string;
  category?: { id: string; name: string };
};

type TeacherSubject = {
  subject: { id: string; name: string };
  price: number;
  duration: number; // минуты
};

type SubjectItem = { id?: string; name: string };

type TeacherProfileDTO = {
  id: string;
  userId: string;
  user?: { firstName?: string | null; lastName?: string | null; login?: string | null };
  photo?: string | null;
  aboutShort?: string | null;
  aboutFull?: string | null;
  teacherSubjects?: TeacherSubject[];
  subjects?: SubjectItem[];
  priceRange?: { min: number; max: number } | null;
};

const API = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/+$/, '');
type PriceKey = 'gte500' | '500-800' | '800-1200' | 'gte1200' | '';
const PRICE_MAP: Record<Exclude<PriceKey, ''>, { min?: number; max?: number }> = {
  'gte500': { min: 500 },
  '500-800': { min: 500, max: 800 },
  '800-1200': { min: 800, max: 1200 },
  'gte1200': { min: 1200 },
};

function fullName(t: TeacherProfileDTO) {
  const fn = t.user?.firstName?.trim() ?? '';
  const ln = t.user?.lastName?.trim() ?? '';
  const login = t.user?.login?.trim() ?? '';
  if (fn || ln) return `${fn} ${ln}`.trim();
  return login || 'Преподаватель';
}

function shortAbout(t: TeacherProfileDTO) {
  return (t.aboutShort ?? t.aboutFull ?? '').trim();
}

function subjectsList(t: TeacherProfileDTO): SubjectItem[] {
  const a: SubjectItem[] = t.subjects ?? [];
  const b: SubjectItem[] = (t.teacherSubjects ?? [])
    .map(x => x.subject)
    .filter(Boolean)
    .map(s => ({ id: s.id, name: s.name }));

  const merged = [...a, ...b];
  const seen = new Set<string>();
  const unique: SubjectItem[] = [];
  for (const s of merged) {
    const key = (s.id || s.name).toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      unique.push({ id: s.id, name: s.name });
    }
  }
  return unique;
}

function priceAndDuration(t: TeacherProfileDTO, subjectId?: string | null) {
  const ts = (t.teacherSubjects ?? []).filter(Boolean);
  if (subjectId) {
    const hit = ts.find(x => x.subject.id === subjectId);
    if (hit) return { price: hit.price, duration: hit.duration };
  }
  if (ts.length) {
    let min = ts[0];
    for (const x of ts) if (x.price < min.price) min = x;
    return { price: min.price, duration: min.duration };
  }
  return { price: t.priceRange?.min ?? null, duration: null as number | null };
}

/** Собираем множество ID предметов преподавателя */
function getTeacherSubjectIds(t: TeacherProfileDTO): Set<string> {
  const ids = new Set<string>();
  (t.teacherSubjects ?? []).forEach(ts => ids.add(ts.subject.id));
  (t.subjects ?? []).forEach(s => { if (s.id) ids.add(s.id); });
  return ids;
}

/** Проверка принадлежности к категории (через справочник subjects) */
function teacherMatchesCategory(t: TeacherProfileDTO, categoryId: string, subjectsDict: Map<string, Subject>): boolean {
  const ids = getTeacherSubjectIds(t);
  if (ids.size === 0) {
    // фолбэк по именам, если нет id: сравниваем по имени с любым предметом категории
    const teacherNames = new Set((t.subjects ?? []).map(s => s.name.toLowerCase()));
    for (const subj of subjectsDict.values()) {
      if (subj.categoryId === categoryId && teacherNames.has(subj.name.toLowerCase())) {
        return true;
      }
    }
    return false;
  }
  for (const id of ids) {
    const subj = subjectsDict.get(id);
    if (subj && subj.categoryId === categoryId) return true;
  }
  return false;
}

/** Проверка наличия конкретного предмета (по ID, фолбэк — по имени) */
function teacherHasSubject(t: TeacherProfileDTO, subjectId: string, subjectsDict: Map<string, Subject>): boolean {
  const ids = getTeacherSubjectIds(t);
  if (ids.has(subjectId)) return true;

  // фолбэк, если у препода нет id у предметов: сверим имена
  const target = subjectsDict.get(subjectId);
  if (!target) return false;
  const targetName = target.name.toLowerCase();
  return (t.subjects ?? []).some(s => s.name.toLowerCase() === targetName);
}

export default function TeachersClient() {
  const sp = useSearchParams();
  const router = useRouter();

  // начальные параметры из URL
  const initSubjectId = sp.get('subjectId') || '';
  const initCategoryId = sp.get('categoryId') || '';
  const initQuery = sp.get('q') || '';

  // состояние фильтров
  const [categories, setCategories] = useState<Category[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectId, setSubjectId] = useState(initSubjectId);
  const [categoryId, setCategoryId] = useState(initCategoryId);
  const [priceKey, setPriceKey] = useState<PriceKey>('');
  const [sort, setSort] = useState<'priceAsc' | 'priceDesc' | ''>('');

  // данные
  const [teachers, setTeachers] = useState<TeacherProfileDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [trialOpen, setTrialOpen] = useState(false);

  // быстрый доступ к предметам по id
  const subjectsDict = useMemo(
    () => new Map(subjects.map(s => [s.id, s] as const)),
    [subjects]
  );

  // справочники
  useEffect(() => {
    (async () => {
      try {
        const [catRes, subRes] = await Promise.all([
          fetch(`${API}/categories`, { headers: { accept: 'application/json' }, credentials: 'include', cache: 'no-store' }),
          fetch(`${API}/subjects`,   { headers: { accept: 'application/json' }, credentials: 'include', cache: 'no-store' }),
        ]);
        if (catRes.ok) setCategories(await catRes.json());
        if (subRes.ok) setSubjects(await subRes.json());
      } catch {}
    })();
  }, [API]);

  // Пришли с q=Название → найдём предмет и выставим subjectId/categoryId
  useEffect(() => {
    if (!initQuery || subjectId) return;
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`${API}/subjects/search?query=${encodeURIComponent(initQuery)}`, {
          headers: { accept: 'application/json' }, credentials: 'include', cache: 'no-store'
        });
        if (r.ok) {
          const arr: Subject[] = await r.json();
          const s = arr?.[0];
          if (s && !cancelled) {
            setSubjectId(s.id);
            setCategoryId(s.category?.id || s.categoryId || '');
            const usp = new URLSearchParams(sp.toString());
            usp.set('subjectId', s.id);
            if (s.categoryId) usp.set('categoryId', s.categoryId);
            usp.delete('q');
            router.replace(`/teachers?${usp.toString()}`);
          }
        }
      } catch {}
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initQuery, API]);

  const subjectsForCategory = useMemo(
    () => subjects.filter(s => !categoryId || s.categoryId === categoryId),
    [subjects, categoryId]
  );

  // Держим URL в синхроне с фильтрами
  useEffect(() => {
    const usp = new URLSearchParams();
    if (categoryId) usp.set('categoryId', categoryId);
    if (subjectId)  usp.set('subjectId', subjectId);
    router.replace(usp.toString() ? `/teachers?${usp.toString()}` : `/teachers`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId, subjectId]);

  // Загрузка преподавателей (если фильтры пустые — отдаём всех)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const qs = new URLSearchParams();
        if (subjectId)  qs.set('subjectId', subjectId);
        if (categoryId) qs.set('categoryId', categoryId);

        let data: any = null;
        try {
          const r = await fetch(`${API}/teachers?${qs.toString()}`, {
            headers: { accept: 'application/json' }, credentials: 'include', cache: 'no-store'
          });
          if (r.ok) data = await r.json();
        } catch {}

        if (!data) {
          try {
            const r2 = await fetch(`${API}/teachers/summary?${qs.toString()}`, {
              headers: { accept: 'application/json' }, credentials: 'include', cache: 'no-store'
            });
            if (r2.ok) data = await r2.json();
          } catch {}
        }

        const listRaw: TeacherProfileDTO[] =
          Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : []);
        const list: TeacherProfileDTO[] = (listRaw ?? []).map((t) => ({
          ...t,
          user: t.user ?? { firstName: undefined, lastName: undefined, login: undefined },
          teacherSubjects: t.teacherSubjects ?? [],
          subjects: subjectsList(t),
          aboutShort: t.aboutShort ?? t.aboutFull ?? null,
        }));

        // ------ Новый шаг: строгая фильтрация по предмету/категории ------
        let filtered = list;

        if (subjectId) {
          // Если выбран предмет — показываем только тех, у кого он есть
          filtered = filtered.filter(t => teacherHasSubject(t, subjectId, subjectsDict));
        } else if (categoryId) {
          // Если категория выбрана, но предмет — нет: фильтруем по категории
          filtered = filtered.filter(t => teacherMatchesCategory(t, categoryId, subjectsDict));
        }
        // Если оба фильтра пустые — оставляем всех (как и требовалось)

        // ----- Затем фильтр по цене -----
        if (priceKey && PRICE_MAP[priceKey as Exclude<PriceKey, ''>]) {
          const { min, max } = PRICE_MAP[priceKey as Exclude<PriceKey, ''>];
          filtered = filtered.filter(t => {
            const { price } = priceAndDuration(t, subjectId || null);
            if (price == null) return false;
            if (min != null && price < min) return false;
            if (max != null && price > max) return false;
            return true;
          });
        }

        // ----- И сортировка -----
        if (sort) {
          filtered = [...filtered].sort((a, b) => {
            const aPrice = priceAndDuration(a, subjectId || null).price ?? Number.MAX_SAFE_INTEGER;
            const bPrice = priceAndDuration(b, subjectId || null).price ?? Number.MAX_SAFE_INTEGER;
            return sort === 'priceAsc' ? aPrice - bPrice : bPrice - aPrice;
          });
        }

        if (!cancelled) setTeachers(filtered);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [API, subjectId, categoryId, priceKey, sort, subjectsDict]);

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="mb-4 text-2xl font-extrabold">Найти преподавателя</h1>

      {/* Фильтры */}
      <div className="mb-6 grid gap-3 md:grid-cols-4">
        <select
          value={categoryId}
          onChange={(e) => { setCategoryId(e.target.value); setSubjectId(''); }}
          className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3"
        >
          <option value="">Все категории</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <select
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)}
          className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3"
        >
          <option value="">Все предметы</option>
          {subjectsForCategory.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        <select
          value={priceKey}
          onChange={(e) => setPriceKey(e.target.value as PriceKey)}
          className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3"
        >
          <option value="">Стоимость: не выбрано</option>
          <option value="gte500">От 500 за урок</option>
          <option value="500-800">500–800 за урок</option>
          <option value="800-1200">800–1200 за урок</option>
          <option value="gte1200">От 1200 за урок</option>
        </select>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as 'priceAsc' | 'priceDesc' | '')}
          className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3"
        >
          <option value="">Без сортировки</option>
          <option value="priceAsc">Цена: по возрастанию</option>
          <option value="priceDesc">Цена: по убыванию</option>
        </select>
      </div>

      {/* Результаты */}
      {loading ? (
        <div className="py-12 text-center text-slate-500">Загрузка…</div>
      ) : teachers.length === 0 ? (
        <div className="py-12 text-center text-slate-500">Преподавателей не найдено</div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {teachers.map((t) => {
            const name = fullName(t);
            const about = shortAbout(t);
            const subs = subjectsList(t);
            const { price, duration } = priceAndDuration(t, subjectId || null);

            return (
              <li key={t.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow">
                <div className="flex items-start gap-4">
                  <div className="h-16 w-16 overflow-hidden rounded-full bg-slate-100">
                    {t.photo ? (
                      <Image
                        src={(t.photo?.startsWith('http') ? t.photo : (t.photo?.startsWith('/') ? t.photo : (t.photo ? `/uploads/${t.photo}` : '')))}
                        alt={name}
                        width={64}
                        height={64}
                      />
                    ) : (
                      <div className="grid h-16 w-16 place-items-center text-slate-400">👩‍🏫</div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center justify-between">
                      <h3 className="truncate text-lg font-bold">{name}</h3>
                      {price != null && (
                        <div className="shrink-0 text-right">
                          <div className="text-sm">
                            от <span className="font-extrabold">{price}</span> ₽
                          </div>
                          <div className="text-xs text-slate-500">
                            за 1 урок{duration ? ` (${duration} мин)` : ''}
                          </div>
                        </div>
                      )}
                    </div>

                    {about && (
                      <p className="mb-2 line-clamp-2 text-sm text-slate-600">{about}</p>
                    )}

                    {subs.length > 0 && (
                      <div className="mb-3 flex flex-wrap gap-2">
                        {subs.map((s) => (
                          <span key={(s.id ?? s.name)} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs">
                            {s.name}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        className="h-10 rounded-xl bg-gradient-to-r from-orange-400 to-amber-500 px-4 text-sm font-bold text-white"
                        onClick={() => setTrialOpen(true)}
                      >
                        Пробный урок
                      </button>
                      <a
                        className="h-10 rounded-xl border border-slate-300 px-4 text-sm font-semibold flex justify-center items-center no-underline"
                        href={`/teacher/${t.id}`}
                      >
                        Страница преподавателя
                      </a>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <TrialRequestModal open={trialOpen} onClose={() => setTrialOpen(false)} />
    </div>
  );
}
