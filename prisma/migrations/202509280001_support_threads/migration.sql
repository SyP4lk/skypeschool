-- PATCH: 2025-09-28

-- Аддитивное расширение поддержки: поток сообщений (threadId), роль и ключ клиента (clientKey)
DO $$ BEGIN
  CREATE TYPE "SupportRole" AS ENUM ('user', 'admin');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "SupportMessage"
  ADD COLUMN IF NOT EXISTS "threadId" TEXT,
  ADD COLUMN IF NOT EXISTS "role" "SupportRole",
  ADD COLUMN IF NOT EXISTS "clientKey" TEXT;

CREATE INDEX IF NOT EXISTS "SupportMessage_threadId_createdAt_idx"
  ON "SupportMessage" ( "threadId", "createdAt" );
