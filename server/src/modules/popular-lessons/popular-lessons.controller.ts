import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { randomUUID } from 'crypto';

type PopularLessonRow = {
  id: string;
  imageUrl: string;
  subjectId: string;
  isActive: boolean;
  sort: number;
  createdAt: Date;
  updatedAt: Date;
  subjectTitle?: string | null;
};

@Controller()
export class PopularLessonsController {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureTable() {
    // Создаём таблицу, если её нет. Без привязки к Prisma-модели.
    await this.prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "PopularLesson" (
        "id" TEXT PRIMARY KEY,
        "imageUrl" TEXT NOT NULL,
        "subjectId" TEXT NOT NULL,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "sort" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    // FK на Subject — если таблица существует
    await this.prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Subject') THEN
          ALTER TABLE "PopularLesson"
          ADD CONSTRAINT IF NOT EXISTS "PopularLesson_subjectId_fkey"
          FOREIGN KEY ("subjectId") REFERENCES "Subject"("id")
          ON DELETE RESTRICT ON UPDATE CASCADE;
        END IF;
      END$$;
    `);
  }

  @Get('public/popular-lessons')
  async listPublic(@Query('limit') limit = '6') {
    await this.ensureTable();
    const take = Math.max(1, Math.min(Number(limit) || 6, 24));
    const rows: PopularLessonRow[] = await this.prisma.$queryRawUnsafe(
      `
      SELECT pl.*, s.title AS "subjectTitle"
      FROM "PopularLesson" pl
      LEFT JOIN "Subject" s ON s.id = pl."subjectId"
      WHERE pl."isActive" = true
      ORDER BY pl."sort" ASC, pl."createdAt" DESC
      LIMIT $1
      `,
      take,
    );
    // Вернём subject в виде вложенного объекта, не ломая фронт
    const items = rows.map(r => ({
      id: r.id,
      imageUrl: r.imageUrl,
      subjectId: r.subjectId,
      isActive: r.isActive,
      sort: r.sort,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      subject: r.subjectTitle ? { title: r.subjectTitle } : null,
    }));
    return { items };
  }

  @Get('admin/popular-lessons')
  async listAdmin() {
    await this.ensureTable();
    const rows: PopularLessonRow[] = await this.prisma.$queryRawUnsafe(`
      SELECT pl.*, s.title AS "subjectTitle"
      FROM "PopularLesson" pl
      LEFT JOIN "Subject" s ON s.id = pl."subjectId"
      ORDER BY pl."sort" ASC, pl."createdAt" DESC
    `);
    const items = rows.map(r => ({
      id: r.id,
      imageUrl: r.imageUrl,
      subjectId: r.subjectId,
      isActive: r.isActive,
      sort: r.sort,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      subject: r.subjectTitle ? { title: r.subjectTitle } : null,
    }));
    return { items };
  }

  @Post('admin/popular-lessons')
  async create(@Body() dto: any) {
    await this.ensureTable();
    const imageUrl = String(dto?.imageUrl || '').trim();
    const subjectId = String(dto?.subjectId || '').trim();
    const isActive = dto?.isActive !== false;
    const sort = Number.isFinite(Number(dto?.sort)) ? Number(dto.sort) : 0;
    if (!imageUrl || !subjectId) {
      throw new Error('imageUrl_and_subjectId_required');
    }
    const id = randomUUID();

    await this.prisma.$executeRawUnsafe(
      `
      INSERT INTO "PopularLesson" ("id","imageUrl","subjectId","isActive","sort","createdAt","updatedAt")
      VALUES ($1,$2,$3,$4,$5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `,
      id, imageUrl, subjectId, isActive, sort,
    );

    const [item] = await this.prisma.$queryRawUnsafe<PopularLessonRow[]>(
      `
      SELECT pl.*, s.title AS "subjectTitle"
      FROM "PopularLesson" pl
      LEFT JOIN "Subject" s ON s.id = pl."subjectId"
      WHERE pl.id = $1
      `,
      id,
    );
    return {
      item: item && {
        ...item,
        subject: item.subjectTitle ? { title: item.subjectTitle } : null,
      },
    };
  }

  @Put('admin/popular-lessons/:id')
  async update(@Param('id') id: string, @Body() dto: any) {
    await this.ensureTable();
    const sets: string[] = [];
    const vals: any[] = [];
    let idx = 1;

    const add = (sql: string, val: any) => {
      sets.push(sql.replace('?', `$${++idx}`));
      vals.push(val);
    };

    if (dto?.imageUrl != null) add(`"imageUrl" = ?`, String(dto.imageUrl));
    if (dto?.subjectId != null) add(`"subjectId" = ?`, String(dto.subjectId));
    if (dto?.isActive != null) add(`"isActive" = ?`, !!dto.isActive);
    if (dto?.sort != null && Number.isFinite(Number(dto.sort))) add(`"sort" = ?`, Number(dto.sort));

    await this.prisma.$executeRawUnsafe(
      `
      UPDATE "PopularLesson"
      SET ${sets.length ? sets.join(', ') + ',' : ''} "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = $1
      `,
      id, ...vals,
    );

    const [item] = await this.prisma.$queryRawUnsafe<PopularLessonRow[]>(
      `
      SELECT pl.*, s.title AS "subjectTitle"
      FROM "PopularLesson" pl
      LEFT JOIN "Subject" s ON s.id = pl."subjectId"
      WHERE pl.id = $1
      `,
      id,
    );
    return {
      item: item && {
        ...item,
        subject: item.subjectTitle ? { title: item.subjectTitle } : null,
      },
    };
  }

  @Delete('admin/popular-lessons/:id')
  async remove(@Param('id') id: string) {
    await this.ensureTable();
    await this.prisma.$executeRawUnsafe(`DELETE FROM "PopularLesson" WHERE "id" = $1`, id);
    return { ok: true };
  }
}
