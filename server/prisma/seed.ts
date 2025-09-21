import * as path from 'path';
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const login = 'admin';
  const password = process.env.ADMIN_INITIAL_PASSWORD ?? 'Admin12345!';
  const hash = await argon2.hash(password);

  await prisma.user.upsert({
    where: { login },
    update: { passwordHash: hash, role: 'admin', tz: 'Europe/Moscow', firstName: 'Админ', lastName: 'Сайта' },
    create: { login, passwordHash: hash, role: 'admin', tz: 'Europe/Moscow', firstName: 'Админ', lastName: 'Сайта' },
  });

  console.log('Admin is ready:', login);
  console.log('Temp password:', password);
}

main().then(()=>prisma.$disconnect()).catch(e=>{console.error(e);return prisma.$disconnect();});
