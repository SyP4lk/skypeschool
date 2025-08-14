export function fullName(u?: { firstName?: string|null; lastName?: string|null; login?: string }) {
  const n = [u?.firstName, u?.lastName].filter(Boolean).join(' ').trim();
  return n || u?.login || '—';
}
