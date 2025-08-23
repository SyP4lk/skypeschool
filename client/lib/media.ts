// client/lib/media.ts
export function mediaUrl(path?: string | null): string {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  const api = process.env.NEXT_PUBLIC_API_URL || '';
  const origin = api.replace(/\/api\/?$/i, '');
  const normalized = path.startsWith('/') ? path : '/' + path;
  return origin + normalized;
}
