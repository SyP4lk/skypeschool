'use client';

import { useEffect, useState } from 'react';

type Article = { id: string; slug: string; title: string; content: string; image?: string | null; createdAt: string };

function formatDate(d: string) {
  const date = new Date(d);
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

export default function ArticlePage({ params }: { params: { slug: string } }) {
  const api = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '');
  const base = api.replace(/\/api$/, '');
  const [a, setA] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${api}/articles/${params.slug}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setA(data);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [api, params.slug]);

  if (loading) return <main className="max-w-3xl mx-auto px-4 py-8">Загрузка…</main>;
  if (!a) return <main className="max-w-3xl mx-auto px-4 py-8">Статья не найдена</main>;

  const paragraphs = (a.content || '').split(/\n{2,}/).map((p, i) => <p key={i} className="mb-4">{p}</p>);

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">{a.title}</h1>
      <div className="text-sm text-gray-500 mb-6">{formatDate(a.createdAt)}</div>
      {a.image && (
        <div className="rounded-xl overflow-hidden mb-6 bg-[#6f9aa3]">
          <img src={`${base}${a.image}`} alt={a.title} className="w-full h-auto object-cover" />
        </div>
      )}
      <article className="prose prose-zinc max-w-none">
        {paragraphs}
      </article>
    </main>
  );
}
