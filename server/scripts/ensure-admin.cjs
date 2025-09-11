/* eslint-disable */
const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');

(async () => {
  const prisma = new PrismaClient();
  try {
    const login = process.env.ADMIN_LOGIN || 'admin';
    const pass  = process.env.ADMIN_INITIAL_PASSWORD || 'Admin12345!';
    const hash  = await argon2.hash(pass, { type: argon2.argon2id });

    // ВАЖНО: одна SQL-команда, без несуществующих колонок
    await prisma.$executeRaw`
      INSERT INTO "User" ("login","role","passwordHash")
      VALUES (${login}, ${'admin'}, ${hash})
      ON CONFLICT ("login") DO UPDATE
      SET "role"=${'admin'}, "passwordHash"=${hash};
    `;

    console.log(`OK: admin user ready -> login=${login} (argon2id)`);
  } catch (e) {
    console.error('ensure-admin warning (non-fatal):', e?.message || e);
  } finally {
    await prisma.$disconnect();
    // Не блокируем запуск приложения
    process.exit(0);
  }
})();
