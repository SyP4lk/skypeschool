'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

type Article = { id: string; slug: string; title: string; content: string; image?: string | null; createdAt: string };

export default function AdminEditArticlePage() {
  const api = '/api';
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [data, setData] = useState<Article | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${api}/admin/articles/${params.id}`, { credentials: 'include', cache: 'no-store' });
        if (!res.ok) throw new Error('Не удалось загрузить статью');
        const a: Article = await res.json();
        setData(a);
        setTitle(a.title);
        setContent(a.content);
      } catch (e:any) {
        setError(e.message || 'Ошибка загрузки');
      } finally {
        setLoading(false);
      }
    })();
  }, [api, params.id]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('title', title);
      form.append('content', content);
      if (file) form.append('image', file);
      const res = await fetch(`${api}/admin/articles/${params.id}`, {
        method: 'PATCH',
        body: form,
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Не удалось сохранить');
      const a = await res.json();
      router.push(`/interesnye-stati/${a.slug}`);
    } catch (e:any) {
      setError(e.message || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <main className="max-w-3xl mx-auto px-4 py-8">Загрузка…</main>;
  if (error) return <main className="max-w-3xl mx-auto px-4 py-8 text-red-600">{error}</main>;
  if (!data) return <main className="max-w-3xl mx-auto px-4 py-8">Статья не найдена</main>;

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Редактирование статьи</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Заголовок</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={title}
            onChange={(e)=>setTitle(e.target.value)}
            placeholder="Название статьи"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Изображение (обложка)</label>
          {data.image && (
            <div className="mb-2">
              <img src={data.image} alt="" className="max-h-40 rounded" />
            </div>
          )}
          <input type="file" accept="image/*" onChange={(e)=>setFile(e.target.files?.[0] || null)} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Содержимое</label>
          <textarea
            className="w-full border rounded px-3 py-2 min-h-[300px]"
            value={content}
            onChange={(e)=>setContent(e.target.value)}
            placeholder="Текст статьи (параграфы разделяйте пустой строкой)"
          />
        </div>
        <div className="flex gap-3">
          <button disabled={saving} className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-60">
            {saving ? 'Сохранение…' : 'Сохранить'}
          </button>
          <button type="button" onClick={()=>router.back()} className="px-4 py-2 rounded border">
            Отмена
          </button>
        </div>
      </form>
    </main>
  );
}
