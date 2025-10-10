/* eslint-disable */
const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');

(async () => {
  const prisma = new PrismaClient();
  try {
    const login = process.env.ADMIN_LOGIN || 'admin';
    const pass  = process.env.ADMIN_INITIAL_PASSWORD || 'Admin12345!';
    const hash  = await argon2.hash(pass, { type: argon2.argon2id });

    // Без raw SQL, корректно для enum Role
    await prisma.user.upsert({
      where: { login },
      update: { role: 'admin', passwordHash: hash },
      create: { login, role: 'admin', passwordHash: hash },
    });

    console.log(`OK: admin user ready -> login=${login} (argon2id)`);
  } catch (e) {
    console.error('ensure-admin warning (non-fatal):', e?.message || e);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
})();
