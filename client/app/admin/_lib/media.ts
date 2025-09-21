// client/lib/media.ts
export function mediaUrl(path?: string | null) {
  if (!path) return '';
  if (/^https?:\/\//.test(path)) return path;
  const base = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/api$/, '');
  return `${base}${path}`;
}
