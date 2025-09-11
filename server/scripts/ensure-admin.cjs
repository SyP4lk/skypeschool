/* eslint-disable */
const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');

(async function run() {
  const prisma = new PrismaClient();
  try {
    const login = process.env.ADMIN_LOGIN || 'admin';
    const pass = process.env.ADMIN_INITIAL_PASSWORD || 'Admin12345!';

    const hash = await argon2.hash(pass, { type: argon2.argon2id });

    const user = await prisma.user.upsert({
      where: { login },
      update: {
        role: 'admin',
        passwordHash: hash,
      },
      create: {
        login,
        role: 'admin',
        passwordHash: hash,
        firstName: 'Admin',
        lastName: '',
        balance: 0,
      },
    });

    console.log(`OK: admin user ready -> login=${user.login} (argon2id)`);
  } catch (e) {
    console.error('ensure-admin failed:', e);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
})();
