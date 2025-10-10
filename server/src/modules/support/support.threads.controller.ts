// src/modules/support/support.threads.controller.ts
// PATCH: 2025-09-29 — support: стабильный threadId=clientKey, >= after, сортировка, ответы админа в публичной ленте
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';

// простой uuid без зависимостей
function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/* ---------------- ПУБЛИЧНЫЙ ВХОД ОТ ВИДЖЕТА ---------------- */

@Controller('support')
export class SupportPublicController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  async create(
    @Body() body: { message?: string; name?: string; email?: string; phone?: string; clientKey?: string },
  ) {
    const text = (body?.message || '').trim();
    if (!text) throw new BadRequestException('message required');

    // 1 пользователь = 1 тред: используем стабильный clientKey как threadId
    const clientKey = (body?.clientKey || '').trim() || uuid();
    const threadId = clientKey;

    const id = uuid();
    const fromLogin = (body?.name || '').trim() || null;
    const contact = (body?.email || body?.phone || '').trim() || null;

    await (this.prisma as any).$queryRawUnsafe(
      `INSERT INTO "SupportMessage"
        ("id","threadId","role","message","status","createdAt","fromLogin","contact","clientKey")
       VALUES ($1, $2, 'user', $3, 'new', NOW(), $4, $5, $6)`,
      id,
      threadId,
      text,
      fromLogin,
      contact,
      clientKey,
    );

    return { ok: true, threadId, id, clientKey };
  }
}

/* ---------------- ПУБЛИЧНОЕ ЧТЕНИЕ ЛЕНТЫ ---------------- */

@Controller('support/threads')
export class SupportThreadsPublicController {
  constructor(private readonly prisma: PrismaService) {}

  // ВАЖНО: включаем ответы админа этому же треду; after — по >=
  @Get(':id/messages')
  async thread(
    @Param('id') id: string,
    @Query('clientKey') clientKey?: string,
    @Query('after') after?: string,
  ) {
    if (!id) throw new BadRequestException('threadId required');

    const params: any[] = [id];
    let sql = `
      SELECT id::text AS id, message, "role", "createdAt"
      FROM "SupportMessage"
      WHERE "threadId" = $1
    `;

    if (clientKey) {
      params.push(clientKey);
      sql += ` AND ("clientKey" = $${params.length} OR "role" = 'admin')`;
    }

    if (after) {
      const d = new Date(after);
      if (!Number.isFinite(+d)) throw new BadRequestException('bad "after"');
      params.push(d);
      sql += ` AND "createdAt" >= $${params.length}`; // не ">", а ">="
    }

    sql += ` ORDER BY "createdAt" ASC, "id" ASC`;

    const rows = await (this.prisma as any).$queryRawUnsafe(sql, ...params);
    return { items: rows };
  }
}

/* ---------------- АДМИНКА ---------------- */

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/support/threads')
export class AdminSupportThreadsController {
  constructor(private readonly prisma: PrismaService) {}

  // список тредов с метаданными (имя/контакт берём последнее непустое)
  @Get()
  async list(@Query('status') _status?: 'new' | 'open' | 'closed', @Query('query') _query?: string) {
    const items = await (this.prisma as any).$queryRawUnsafe(`
      SELECT
        t."threadId"                   AS id,
        MIN(t."createdAt")             AS "firstAt",
        MAX(t."createdAt")             AS "lastAt",
        COUNT(*)::int                  AS count,
        (SELECT sm."fromLogin" FROM "SupportMessage" sm
           WHERE sm."threadId" = t."threadId" AND sm."fromLogin" IS NOT NULL
           ORDER BY sm."createdAt" DESC LIMIT 1) AS "fromLogin",
        (SELECT sm."contact" FROM "SupportMessage" sm
           WHERE sm."threadId" = t."threadId" AND sm."contact" IS NOT NULL
           ORDER BY sm."createdAt" DESC LIMIT 1) AS "contact"
      FROM "SupportMessage" t
      WHERE t."threadId" IS NOT NULL
      GROUP BY t."threadId"
      ORDER BY MAX(t."createdAt") DESC
      LIMIT 200
    `);
    return { items };
  }

  // лента админки: >= after, стабильная сортировка
  @Get(':id/messages')
  async messages(@Param('id') id: string, @Query('after') after?: string) {
    const params: any[] = [id];
    let sql = `
      SELECT id::text AS id, message, "role", "createdAt"
      FROM "SupportMessage"
      WHERE "threadId" = $1
    `;

    if (after) {
      const d = new Date(after);
      if (!Number.isFinite(+d)) throw new BadRequestException('bad "after"');
      params.push(d);
      sql += ` AND "createdAt" >= $${params.length}`;
    }

    sql += ` ORDER BY "createdAt" ASC, "id" ASC`;

    const items = await (this.prisma as any).$queryRawUnsafe(sql, ...params);
    return { items };
  }

  // ответ от имени админа
  @Post(':id/messages')
  async reply(@Param('id') id: string, @Body() body: { text: string }, @Req() req: any) {
    const text = (body?.text || '').trim();
    if (!text) throw new BadRequestException('text required');

    const isAdmin = req?.user?.role === 'admin';
    if (!isAdmin) throw new UnauthorizedException('admin only');

    const msgId = uuid();

    await (this.prisma as any).$queryRawUnsafe(
      `INSERT INTO "SupportMessage"
        ("id","threadId","role","message","status","createdAt")
       VALUES ($1, $2, 'admin', $3, 'new', NOW())`,
      msgId,
      id,
      text,
    );

    return { ok: true, id: msgId };
  }

  @Patch(':id')
  async setStatus(_id: string) {
    return { ok: true };
  }
}
