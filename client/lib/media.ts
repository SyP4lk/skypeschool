// client/lib/media.ts
export function mediaUrl(path?: string | null): string {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  // Прокидываем через фронтовый прокси, чтобы не зависеть от домена бэка.
  const normalized = path.startsWith('/') ? path.slice(1) : path;
  return `/api/${normalized}`;
}
