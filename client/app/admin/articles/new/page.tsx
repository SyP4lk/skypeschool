'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function AdminNewArticlePage() {
  const api = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '');
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) { setError('Введите заголовок'); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('title', title);
      fd.append('content', content);
      if (file) fd.append('image', file);
      const res = await fetch(`${api}/admin/articles`, {
        method: 'POST',
        body: fd,
        credentials: 'include',
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Ошибка при создании статьи');
      }
      const json = await res.json();
      router.push(`/interesnye-stati/${json.slug}`);
    } catch (err: any) {
      setError(err.message || 'Ошибка');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">Новая статья</h1>
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
          <input type="file" accept="image/*" onChange={(e)=>setFile(e.target.files?.[0] || null)} />
          <p className="text-xs text-gray-500 mt-1">Рекомендуется 1200×630, ≤ 2–3 МБ</p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Текст статьи</label>
          <textarea
            className="w-full border rounded px-3 py-2 min-h-[220px]"
            value={content}
            onChange={(e)=>setContent(e.target.value)}
            placeholder="Текст статьи. Параграфы разделяйте пустой строкой."
          />
        </div>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <div className="flex gap-3">
          <button
            type="submit"
            className="px-4 py-2 rounded bg-black text-white disabled:opacity-60"
            disabled={loading}
          >
            {loading ? 'Сохранение…' : 'Сохранить'}
          </button>
        </div>
      </form>
    </div>
  );
}
