/**
 * Универсальная проверка пароля (argon2/bcrypt/bcryptjs, безопасный fallback).
 * Никаких строгих зависимостей: подключаем библиотеки динамически через require().
 */
let bcryptCompare: null | ((p: string, h: string) => Promise<boolean>) = null;
try { const b = require('bcrypt');   bcryptCompare = (p: string, h: string) => b.compare(p, h); } catch {}
try { if (!bcryptCompare) { const bjs = require('bcryptjs'); bcryptCompare = (p: string, h: string) => bjs.compare(p, h); } } catch {}

export async function verifyPassword(plain: string, hash: string | null | undefined): Promise<boolean> {
  if (!hash) return false;
  try {
    if (hash.startsWith('$argon2')) {
      const argon2 = require('argon2');
      return await argon2.verify(hash, plain);
    }
    if (hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$')) {
      if (!bcryptCompare) return false;
      return await bcryptCompare(plain, hash);
    }
    // fallback: если в сид-среде пароль лежит в явном виде
    return plain === hash;
  } catch {
    return false;
  }
}
