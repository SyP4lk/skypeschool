-- PATCH: 2025-09-28 — support threads fields

-- 1) threadId (группировка диалога)
ALTER TABLE "SupportMessage" ADD COLUMN IF NOT EXISTS "threadId" TEXT;

-- 2) роль отправителя ('user'|'admin') — храним как TEXT для совместимости
ALTER TABLE "SupportMessage" ADD COLUMN IF NOT EXISTS "role" TEXT;

-- 3) clientKey (идентификатор клиента из виджета)
ALTER TABLE "SupportMessage" ADD COLUMN IF NOT EXISTS "clientKey" TEXT;

-- 4) Индекс для быстрых выборок ленты
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_supportmessage_thread_created'
  ) THEN
    CREATE INDEX idx_supportmessage_thread_created ON "SupportMessage"("threadId","createdAt");
  END IF;
END$$;

-- 5) Бэкофилл существующих записей:
-- threadId ← существующий threadId | clientKey | id::text
UPDATE "SupportMessage"
SET "threadId" = COALESCE("threadId", "clientKey", CAST("id" AS TEXT))
WHERE "threadId" IS NULL;

-- role по умолчанию как 'user', если не задана
UPDATE "SupportMessage"
SET "role" = COALESCE("role", 'user')
WHERE "role" IS NULL;
