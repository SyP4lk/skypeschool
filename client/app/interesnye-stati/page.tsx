import Link from 'next/link';

type ArticleCard = { id: string; slug: string; title: string; image?: string | null; createdAt: string };
type ListResponse = { items: ArticleCard[]; total: number; page: number; limit: number };

const PAGE_SIZE = 12;

function formatDate(d: string) {
  const date = new Date(d);
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

function Pagination({ page, pages }: { page: number; pages: number }) {
  if (pages <= 1) return null;
  const mk = (p: number) => `/interesnye-stati?page=${p}`;
  const window: number[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(pages, page + 2);
  for (let i = start; i <= end; i++) window.push(i);

  return (
    <nav className="mt-8 flex items-center justify-center gap-2 text-sm">
      <Link
        href={mk(Math.max(1, page - 1))}
        aria-disabled={page === 1}
        className={`px-3 py-2 border rounded ${page === 1 ? 'pointer-events-none opacity-60' : ''}`}
      >
        ← Назад
      </Link>
      {start > 1 && (
        <>
          <Link href={mk(1)} className="px-3 py-2 border rounded">1</Link>
          {start > 2 && <span className="px-2">…</span>}
        </>
      )}
      {window.map((p) => (
        <Link
          key={p}
          href={mk(p)}
          aria-current={p === page ? 'page' : undefined}
          className={`px-3 py-2 border rounded ${p === page ? 'bg-black text-white' : ''}`}
        >
          {p}
        </Link>
      ))}
      {end < pages && (
        <>
          {end < pages - 1 && <span className="px-2">…</span>}
          <Link href={mk(pages)} className="px-3 py-2 border rounded">{pages}</Link>
        </>
      )}
      <Link
        href={mk(Math.min(pages, page + 1))}
        aria-disabled={page === pages}
        className={`px-3 py-2 border rounded ${page === pages ? 'pointer-events-none opacity-60' : ''}`}
      >
        Вперёд →
      </Link>
    </nav>
  );
}

type Props = { searchParams?: Promise<{ page?: string }> };
export default async function Page({ searchParams }: Props) {
  const sp = (await searchParams) ?? {};
  const page = Math.max(1, Number(sp.page || 1) || 1);

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/articles?limit=${PAGE_SIZE}&page=${page}`, {
    cache: 'no-store',
  });
  if (!res.ok) {
    return (
      <main className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Интересные статьи</h1>
        <p className="text-red-600">Не удалось загрузить список статей.</p>
      </main>
    );
  }
  const data = (await res.json()) as ListResponse;
  const pages = Math.max(1, Math.ceil(data.total / data.limit || PAGE_SIZE));

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Интересные статьи</h1>

      {data.items.length === 0 ? (
        <p className="text-gray-600">Пока нет статей.</p>
      ) : (
        <>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((a) => (
              <li key={a.id} className="border rounded-lg overflow-hidden hover:shadow-sm transition">
                <Link href={`/interesnye-stati/${a.slug}`} className="block">
                  {a.image && (
                    <img src={a.image} alt="" className="w-full h-44 object-cover" />
                  )}
                  <div className="p-4">
                    <div className="text-xs text-gray-500 mb-2">{formatDate(a.createdAt)}</div>
                    <div className="font-medium">{a.title}</div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          <Pagination page={data.page} pages={pages} />
        </>
      )}
    </main>
  );
}
