// client/lib/media.ts
/**
 * Склеивает абсолютный URL для картинок из /uploads (бэкенд Render).
 * NEXT_PUBLIC_API_URL = https://skypeschool-server.onrender.com/api
 * => базовый хост: https://skypeschool-server.onrender.com
 */
export function mediaUrl(path?: string | null): string {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;

  const api = process.env.NEXT_PUBLIC_API_URL || '';
  // отрезаем /api в конце
  const origin = api.replace(/\/api\/?$/i, '');
  const normalized = path.startsWith('/') ? path : '/' + path;
  return origin + normalized;
}
