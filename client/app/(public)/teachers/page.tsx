// app/(public)/teachers/page.tsx
import TeachersClient, { TeacherProfileDTO } from './teachers-client';

const API = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api').replace(/\/+$/, '');

type Category = { id: string; name: string };
type Subject = { id: string; name: string; minPrice?: number | null; minDuration?: number | null };

type Props = { searchParams?: Promise<{ categoryId?: string; subjectId?: string; sort?: string }> };

export default async function Page({ searchParams }: Props) {
  const sp = (await searchParams) ?? {};
  const categoryId = sp.categoryId || '';
  const subjectId = sp.subjectId || '';
  const sort = sp.sort || '';

  // словари для фильтров
  const [catsRes, subsRes] = await Promise.all([
    fetch(`${API}/categories`, { cache: 'no-store' }),
    fetch(`${API}/subjects`,   { cache: 'no-store' }),
  ]);

  const categories: Category[] = catsRes.ok ? await catsRes.json() : [];
  const subjects: Subject[]   = subsRes.ok ? await subsRes.json()   : [];

  // загрузка преподавателей по фильтрам
  const qs = new URLSearchParams();
  if (categoryId) qs.set('categoryId', categoryId);
  if (subjectId) qs.set('subjectId', subjectId);

  const listRes = await fetch(`${API}/teachers${qs.toString() ? `?${qs}` : ''}`, { cache: 'no-store' });
  const data = listRes.ok ? await listRes.json() : { items: [] };
  const items: TeacherProfileDTO[] = Array.isArray(data) ? data : (data.items || []);

  // простая серверная сортировка по цене (если надо)
  const sorted = (() => {
    if (!sort) return items;
    const getMin = (t: TeacherProfileDTO) =>
      Math.min(
        ...((t.teacherSubjects || [])
          .map(s => (typeof s.price === 'number' ? s.price! : Number.POSITIVE_INFINITY))),
      );
    if (sort === 'priceAsc') return [...items].sort((a, b) => getMin(a) - getMin(b));
    if (sort === 'priceDesc') return [...items].sort((a, b) => getMin(b) - getMin(a));
    return items;
  })();

  return (
    <TeachersClient
      data={sorted}
      categories={categories}
      subjects={subjects}
      initialFilters={{ categoryId, subjectId, sort }}
    />
  );
}
