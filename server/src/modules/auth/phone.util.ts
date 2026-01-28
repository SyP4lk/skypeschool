export function normalizePhone(raw?: string): string | null {
  if (!raw) return null;
  const digits = String(raw).replace(/\D+/g, '');
  if (digits.length < 10) return null;

  // РФ: 8XXXXXXXXXX -> +7XXXXXXXXXX
  if (digits.length === 11 && digits.startsWith('8')) {
    return '+7' + digits.slice(1);
  }
  // 10 цифр -> считаем РФ и добавляем +7
  if (digits.length === 10) {
    return '+7' + digits;
  }
  // Любая другая длина >=11 — просто добавим '+'
  return '+' + digits;
}

export function looksLikeEmail(s: string): boolean {
  return /.+@.+\..+/.test(s);
}

export function looksLikePhone(s: string): boolean {
  // «похоже на телефон»: цифры/скобки/пробелы/плюс/дефисы и не email
  return /[\d()\s+\-]{7,}/.test(s) && !looksLikeEmail(s);
}
