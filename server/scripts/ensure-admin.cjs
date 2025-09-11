/* Создаёт/обновляет пользователя admin с ролью admin и паролем из .env (ADMIN_INITIAL_PASSWORD) */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');

(async () => {
  const prisma = new PrismaClient();
  try {
    const login = 'admin';
    const pwd = process.env.ADMIN_INITIAL_PASSWORD || 'Admin12345!';
    const passwordHash = await argon2.hash(pwd);

    const user = await prisma.user.upsert({
      where: { login },
      create: { login, role: 'admin', passwordHash },
      update: { role: 'admin', passwordHash },
      select: { id: true, login: true, role: true },
    });

    console.log('OK: admin user ready -> login=admin, password from .env ADMIN_INITIAL_PASSWORD');
    console.log(user);
    process.exit(0);
  } catch (e) {
    console.error('ensure-admin error:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
