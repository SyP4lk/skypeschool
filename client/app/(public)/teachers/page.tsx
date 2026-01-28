// app/(public)/teachers/page.tsx
import TeachersClient from './teachers-client';

export const dynamic = 'force-dynamic'; // форсим серверный рендер по каждому запросу

const API = '/api';

type Category = { id: string; name: string };
type Subject   = { id: string; name: string; categoryId?: string | null; minPrice?: number | null; minDuration?: number | null };
type TeacherSubject = { id?: string; subjectId?: string; name: string; price?: number | null; duration?: number | null };
type TeacherProfileDTO = {
  id: string;
  photo?: string | null;
  aboutShort?: string | null;
  user?: { firstName?: string | null; lastName?: string | null; login?: string | null } | null;
  teacherSubjects?: TeacherSubject[] | null;
};

type Props = { searchParams?: Promise<{ categoryId?: string; subjectId?: string; sort?: string; price?: string }> };

export default async function Page({ searchParams }: Props) {
  const sp = (await searchParams) ?? {};
  const categoryId = sp.categoryId || '';
  const subjectId  = sp.subjectId  || '';
  const sort       = sp.sort       || '';
  const price      = sp.price      || '';

  const [catsRes, subsRes] = await Promise.all([
    fetch(`${API}/categories`, { cache: 'no-store' }),
    fetch(`${API}/subjects`,   { cache: 'no-store' }),
  ]);
  const categories: Category[] = catsRes.ok ? await catsRes.json() : [];
  const subjects: Subject[]    = subsRes.ok ? await subsRes.json()  : [];

  const qs = new URLSearchParams();
  if (categoryId) qs.set('categoryId', categoryId);
  if (subjectId)  qs.set('subjectId', subjectId);

  const listRes = await fetch(`${API}/teachers${qs.toString() ? `?${qs}` : ''}`, { cache: 'no-store' });
  const data = listRes.ok ? await listRes.json() : { items: [] };
  const items: TeacherProfileDTO[] = Array.isArray(data) ? data : (data.items || []);

  const sorted = (() => {
    if (!sort) return items;
    const getMin = (t: TeacherProfileDTO) => {
      const vals = (t.teacherSubjects || []).map(s => (typeof s.price === 'number' ? s.price! : Number.POSITIVE_INFINITY));
      const v = Math.min(...(vals.length ? vals : [Number.POSITIVE_INFINITY]));
      return Number.isFinite(v) ? v : Number.POSITIVE_INFINITY;
    };
    if (sort === 'priceAsc')  return [...items].sort((a, b) => getMin(a) - getMin(b));
    if (sort === 'priceDesc') return [...items].sort((a, b) => getMin(b) - getMin(a));
    return items;
  })();

  return (
    <TeachersClient
      data={sorted}
      categories={categories}
      subjects={subjects}
      initialFilters={{ categoryId, subjectId, sort, price }}
    />
  );
}
