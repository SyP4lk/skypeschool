/* eslint-disable */
const { PrismaClient } = require('@prisma/client');

function toBool(v) {
  return v === true || v === 't' || v === 'true' || v === 1 || v === '1';
}

(async () => {
  const prisma = new PrismaClient();
  try {
    // 1) Добавляем колонки, если их нет (каждая командой отдельно!)
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "email" TEXT`
    );
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "phone" TEXT`
    );

    // 2) Проверяем дубли среди НЕ-NULL значений
    const emailDupRow = await prisma.$queryRawUnsafe(
      `SELECT EXISTS (
         SELECT 1 FROM "public"."User"
         WHERE "email" IS NOT NULL
         GROUP BY "email" HAVING COUNT(*) > 1
       ) AS "exists"`
    );
    const phoneDupRow = await prisma.$queryRawUnsafe(
      `SELECT EXISTS (
         SELECT 1 FROM "public"."User"
         WHERE "phone" IS NOT NULL
         GROUP BY "phone" HAVING COUNT(*) > 1
       ) AS "exists"`
    );
    const emailHasDup = toBool(emailDupRow?.[0]?.exists);
    const phoneHasDup = toBool(phoneDupRow?.[0]?.exists);

    // 3) Создаём UNIQUE индексы только если дублей нет
    if (!emailHasDup) {
      await prisma.$executeRawUnsafe(
        `CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "public"."User"("email")`
      );
    } else {
      console.warn('[patch-db] Skip unique index on "email": duplicates exist');
    }

    if (!phoneHasDup) {
      await prisma.$executeRawUnsafe(
        `CREATE UNIQUE INDEX IF NOT EXISTS "User_phone_key" ON "public"."User"("phone")`
      );
    } else {
      console.warn('[patch-db] Skip unique index on "phone": duplicates exist');
    }

    console.log('[patch-db] OK');
  } catch (e) {
    console.error('[patch-db] warning (non-fatal):', e?.message || e);
  } finally {
    await prisma.$disconnect();
    // Никогда не блокируем старт приложения
    process.exit(0);
  }
})();
