/* eslint-disable */
const { PrismaClient } = require('@prisma/client');

(async () => {
  const prisma = new PrismaClient();
  try {
    // 1) Добавляем колонки, если их нет
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "email" TEXT;
      ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "phone" TEXT;
    `);

    // 2) Проверяем, есть ли дубли по email/phone (с учётом NOT NULL)
    const [{ exists: emailDup }] = await prisma.$queryRawUnsafe(
      `SELECT EXISTS (
         SELECT 1 FROM "public"."User"
         WHERE "email" IS NOT NULL
         GROUP BY "email" HAVING COUNT(*) > 1
       ) AS exists;`
    );
    const [{ exists: phoneDup }] = await prisma.$queryRawUnsafe(
      `SELECT EXISTS (
         SELECT 1 FROM "public"."User"
         WHERE "phone" IS NOT NULL
         GROUP BY "phone" HAVING COUNT(*) > 1
       ) AS exists;`
    );

    // 3) Создаём UNIQUE индексы только если дублей нет
    if (!emailDup) {
      await prisma.$executeRawUnsafe(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE c.relname = 'User_email_key' AND n.nspname = 'public'
          ) THEN
            CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");
          END IF;
        END $$;
      `);
    } else {
      console.warn('[patch-db] Skip unique index on "email": duplicates exist');
    }

    if (!phoneDup) {
      await prisma.$executeRawUnsafe(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE c.relname = 'User_phone_key' AND n.nspname = 'public'
          ) THEN
            CREATE UNIQUE INDEX "User_phone_key" ON "public"."User"("phone");
          END IF;
        END $$;
      `);
    } else {
      console.warn('[patch-db] Skip unique index on "phone": duplicates exist');
    }

    console.log('[patch-db] OK');
  } catch (e) {
    console.error('[patch-db] warning (non-fatal):', e?.message || e);
  } finally {
    await prisma.$disconnect();
    process.exit(0); // не блокируем старт приложения
  }
})();
