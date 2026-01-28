// admin media url helper
export function mediaUrl(path?: string | null) {
  if (!path) return '';
  if (/^https?:\/\//.test(path)) return path;
  const normalized = path.startsWith('/') ? path.slice(1) : path;
  return `/api/${normalized}`;
}
