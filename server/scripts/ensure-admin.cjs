// server/scripts/ensure-admin.cjs
const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');

(async () => {
  const prisma = new PrismaClient();
  const login = process.env.ADMIN_LOGIN || 'admin';
  const password = process.env.ADMIN_INITIAL_PASSWORD || 'Admin12345!';

  try {
    const existing = await prisma.user.findFirst({
      where: { role: 'admin' },
      select: { id: true, login: true }
    });

    if (existing) {
      console.log('[ensure-admin] admin exists:', existing.login || existing.id);
      return;
    }

    const passwordHash = await argon2.hash(password);

    const created = await prisma.user.create({
      data: {
        login,
        passwordHash,
        role: 'admin'
      },
      select: { id: true, login: true }
    });

    console.log('[ensure-admin] admin created:', created.login);
  } catch (e) {
    console.error('[ensure-admin] failed:', e);
  } finally {
    await prisma.$disconnect();
  }
})();
