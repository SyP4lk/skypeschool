-- Создаём таблицу, если её нет
CREATE TABLE IF NOT EXISTS "PopularLesson" (
  "id" TEXT PRIMARY KEY,
  "imageUrl" TEXT NOT NULL,
  "subjectId" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "sort" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Добавляем FK, если есть таблица Subject и ещё нет такого констрейнта
DO $do$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'Subject'
  ) THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'PopularLesson_subjectId_fkey'
    ) THEN
      ALTER TABLE "PopularLesson"
      ADD CONSTRAINT "PopularLesson_subjectId_fkey"
      FOREIGN KEY ("subjectId") REFERENCES "Subject"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
  END IF;
END
$do$;
