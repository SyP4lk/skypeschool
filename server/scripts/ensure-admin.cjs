// Простая инициализация admin-пользователя
// Требует: @prisma/client и argon2 в зависимостях
// ENV: ADMIN_INITIAL_PASSWORD=Admin12345! (или свой)

const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');

(async () => {
  const prisma = new PrismaClient();
  const login = process.env.ADMIN_LOGIN || 'admin';
  const password = process.env.ADMIN_INITIAL_PASSWORD || 'Admin12345!';

  try {
    // Попробуем найти любого администратора
    const existing = await prisma.user.findFirst({
      where: { role: 'admin' },
      select: { id: true, login: true, email: true }
    });

    if (existing) {
      console.log('[ensure-admin] admin already exists:', existing.login || existing.email || existing.id);
      return;
    }

    const passwordHash = await argon2.hash(password);

    // Подгони поля под свою схему User:
    // предполагаем поля: login, passwordHash, role ('admin'|'teacher'|'student')
    const created = await prisma.user.create({
      data: {
        login,
        passwordHash,
        role: 'admin'
      },
      select: { id: true, login: true }
    });

    console.log('[ensure-admin] admin created:', created.login, 'with initial password from ADMIN_INITIAL_PASSWORD');
  } catch (e) {
    console.error('[ensure-admin] failed:', e);
    // Не валим деплой, если что-то не так, просто логируем
  } finally {
    await prisma.$disconnect();
  }
})();
