-- Создание таблицы "PopularLesson" (если её ещё нет)
CREATE TABLE IF NOT EXISTS "PopularLesson" (
  "id"         TEXT PRIMARY KEY,
  "subjectId"  TEXT NOT NULL,
  "imageUrl"   TEXT,
  "isActive"   BOOLEAN NOT NULL DEFAULT TRUE,
  "sort"       INTEGER NOT NULL DEFAULT 100,
  "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Индекс по subjectId (аддитивно, не критично)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'PopularLesson_subjectId_idx'
      AND n.nspname = 'public'
  ) THEN
    CREATE INDEX "PopularLesson_subjectId_idx" ON "PopularLesson" ("subjectId");
  END IF;
END $$;

-- Если раньше были попытки ADD COLUMN IF NOT EXISTS ... NOT NULL, разбей на две команды:
-- ALTER TABLE "PopularLesson" ADD COLUMN IF NOT EXISTS "sort" INTEGER;
-- ALTER TABLE "PopularLesson" ALTER COLUMN "sort" SET DEFAULT 100;
-- ALTER TABLE "PopularLesson" ALTER COLUMN "sort" SET NOT NULL;

-- Аналогично для булевых/дат:
-- ALTER TABLE "PopularLesson" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN;
-- ALTER TABLE "PopularLesson" ALTER COLUMN "isActive" SET DEFAULT TRUE;
-- ALTER TABLE "PopularLesson" ALTER COLUMN "isActive" SET NOT NULL;
