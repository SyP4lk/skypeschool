// app/interesnye-stati/[slug]/page.tsx
import Link from 'next/link';

type Article = {
  id: string;
  slug: string;
  title: string;
  content: string;
  image?: string | null;
  createdAt: string;
};

type Props = { params: Promise<{ slug: string }> };

export default async function Page({ params }: Props) {
  const { slug } = await params;

  const api = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '');
  const res = await fetch(`${api}/articles/${encodeURIComponent(slug)}`, { cache: 'no-store' });

  if (!res.ok) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Статья не найдена</h1>
        <Link className="underline text-sm" href="/interesnye-stati">← Вернуться к списку</Link>
      </main>
    );
  }

  const a: Article = await res.json();
  const paragraphs = (a.content || '')
    .split(/\r?\n\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  const date = new Date(a.createdAt);
  const dateStr = `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${date.getFullYear()}`;

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">{a.title}</h1>
      <div className="text-sm text-gray-500 mb-6">{dateStr}</div>
      {a.image && <img src={a.image} alt="" className="mb-6 rounded" />}
      <article className="space-y-4">
        {paragraphs.map((p, i) => <p key={i}>{p}</p>)}
      </article>
      <div className="mt-8">
        <Link className="underline text-sm" href="/interesnye-stati">← Вернуться к списку</Link>
      </div>
    </main>
  );
}
