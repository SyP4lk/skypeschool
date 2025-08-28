import TeachersClient from './teachers-client';

const API = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api').replace(/\/+$/, '');

type TeacherSubject = { id?: string; subjectId?: string; name: string; price?: number | null; duration?: number | null };
export type TeacherProfileDTO = {
  id: string;
  photo?: string | null;
  aboutShort?: string | null;
  user?: { firstName?: string | null; lastName?: string | null; login?: string | null } | null;
  teacherSubjects?: TeacherSubject[] | null;
};

type Props = { searchParams?: Promise<Record<string, string | undefined>> };

export default async function Page({ searchParams }: Props) {
  const sp = (await searchParams) ?? {};
  const qs = new URLSearchParams();
  if (sp.categoryId) qs.set('categoryId', sp.categoryId);
  if (sp.subjectId) qs.set('subjectId', sp.subjectId);
  if (sp.query) qs.set('query', sp.query);

  const res = await fetch(`${API}/teachers${qs.toString() ? `?${qs}` : ''}`, { cache: 'no-store' });
  if (!res.ok) {
    return (
      <main className="container py-8">
        <h1 className="text-2xl font-bold">Преподаватели</h1>
        <p className="text-red-600 mt-2">Не удалось загрузить список.</p>
      </main>
    );
  }

  const data = (await res.json()) as any;
  const items: TeacherProfileDTO[] = Array.isArray(data) ? data : (data.items || []);

  return <TeachersClient data={items} />;
}
