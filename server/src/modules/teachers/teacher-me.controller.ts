import {
  Controller, Get, Post, Patch, Body, Query, UseGuards, BadRequestException, Param, Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { PrismaService } from '../../prisma.service';
import type { Request } from 'express';

type AnyRec = Record<string, any>;

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('teacher')
@Controller('teacher/me')
export class TeacherMeController {
  constructor(private readonly prisma: PrismaService) {}

  private toNum(v: any, fb = 0) { const n = Number(v); return Number.isFinite(n) ? n : fb; }

  /** Нормализуем статус к planned/completed/cancelled */
  private normStatus(s: any): 'planned'|'completed'|'cancelled' {
    const x = String(s || '').toLowerCase();
    if (x === 'done' || x === 'completed') return 'completed';
    if (x === 'canceled' || x === 'cancelled') return 'cancelled';
    return 'planned';
  }

  /** Любое значение цены → копейки (поддержка старых уроков, где цена была в рублях) */
  private anyToCents(v: any): number {
    const n = Math.round(this.toNum(v, 0));
    if (!Number.isFinite(n) || n <= 0) return 0;
    // эвристика: если значение похоже на рубли — умножаем
    return n >= 1000 ? n : n * 100;
  }

  /** Предметы преподавателя с учётом разных схем */
  @Get('subjects')
  async subjects(@Req() req: Request) {
    const p: AnyRec = this.prisma as any;
    const userId: string = (req as any).user?.id;

    let profileId: string | null = null;
    try { profileId = (await p.teacherProfile?.findFirst?.({ where: { userId }, select: { id: true } }))?.id ?? null; } catch {}

    let items: any[] = [];
    try {
      if (p.teacherSubject?.findMany) {
        const rows = await p.teacherSubject.findMany({
          where: { OR: [ ...(profileId ? [{ teacherId: profileId }] : []), { teacherId: userId } ] },
          include: { subject: true },
        });
        items = rows.map((r: any) => ({
          subjectId: r.subjectId ?? r.subject?.id,
          name: r.subject?.name ?? r.subjectId,
          price: this.toNum(r.price ?? 0),
          durationMin: this.toNum(r.duration ?? r.durationMin ?? 60),
        }));
      }
    } catch {}

    if (!items.length) {
      try {
        const prof = await p.teacherProfile?.findFirst?.({
          where: { userId },
          include: { subjects: { include: { subject: true } } },
        });
        const list = prof?.subjects ?? [];
        items = list.map((r: any) => ({
          subjectId: r.subjectId ?? r.subject?.id,
          name: r.subject?.name ?? r.subjectId,
          price: this.toNum(r.price ?? 0),
          durationMin: this.toNum(r.duration ?? r.durationMin ?? 60),
        }));
      } catch {}
    }

    const uniq = new Map<string, any>();
    for (const i of items) {
      const k = String(i.subjectId || '');
      if (k && !uniq.has(k)) uniq.set(k, i);
    }
    return Array.from(uniq.values());
  }

  /** Поиск учеников (не показываем «удалённых») */
  @Get('students')
  async students(@Query('q') q = '') {
    const p: AnyRec = this.prisma as any;
    const query = (q || '').trim();
    const where: AnyRec = { role: 'student', NOT: [{ login: { contains: '__deleted__' } }] };
    if (query) {
      where.OR = [
        { login: { contains: query, mode: 'insensitive' } },
        { firstName: { contains: query, mode: 'insensitive' } },
        { lastName: { contains: query, mode: 'insensitive' } },
        { phone: { contains: query } },
        { email: { contains: query, mode: 'insensitive' } },
      ];
    }
    try {
      const rows = await p.user.findMany({
        where, orderBy: { createdAt: 'desc' }, take: 20,
        select: { id: true, login: true, firstName: true, lastName: true, phone: true },
      });
      return rows.map((u: any) => ({
        id: u.id,
        label: [u.login, [u.lastName, u.firstName].filter(Boolean).join(' '), u.phone].filter(Boolean).join(' — '),
      }));
    } catch { return []; }
  }

  /** Список моих уроков (статус нормализован, цена в копейках в поле priceCents) */
  @Get('lessons')
  async myLessons(@Req() req: Request) {
    const p: AnyRec = this.prisma as any;
    const teacherId: string = (req as any).user?.id;

    const rows = await p.lesson.findMany({
      where: { teacherId },
      orderBy: { startsAt: 'asc' },
      include: {
        subject: true,
        student: { select: { id: true, login: true } },
      },
    });

    return rows.map((r: any) => {
      const durationMin = this.toNum(r.durationMin ?? r.duration ?? 0);
      const priceCents = this.anyToCents(r.price);
      return {
        id: r.id,
        teacherId: r.teacherId,
        studentId: r.studentId,
        subjectId: r.subjectId,
        startsAt: r.startsAt,
        durationMin,
        status: this.normStatus(r.status),
        channel: r.channel ?? null,
        channelLink: r.channelLink ?? null,
        note: r.note ?? r.comment ?? null,
        priceCents,
        subject: r.subject ? { id: r.subject.id, name: r.subject.name } : null,
        student: r.student ? { id: r.student.id, login: r.student.login } : null,
      };
    });
  }

  /** Назначить урок */
  @Post('lessons')
  async createLesson(@Req() req: Request, @Body() body: AnyRec) {
    const p: AnyRec = this.prisma as any;
    const teacherId: string = (req as any).user?.id;

    const studentId = String(body?.studentId || '').trim();
    const subjectId = String(body?.subjectId || '').trim();
    const startsAtIso = String(body?.startsAt || '').trim();

    if (!studentId) throw new BadRequestException('studentId_required');
    if (!subjectId) throw new BadRequestException('subjectId_required');
    if (!startsAtIso) throw new BadRequestException('startsAt_required');

    const startsAt = new Date(startsAtIso);
    if (isNaN(startsAt.getTime())) throw new BadRequestException('startsAt_invalid');

    const durationMin = this.toNum(body?.durationMin ?? body?.duration ?? 60) || 60;
    const priceCents = this.anyToCents(body?.price);

    // статус пишем в нижнем регистре — как в вашей БД
    const data: AnyRec = {
      teacherId, studentId, subjectId, startsAt,
      ...(p.lesson?.fields?.durationMin !== undefined ? { durationMin } : {}),
      ...(p.lesson?.fields?.duration !== undefined ? { duration: durationMin } : {}),
      ...(p.lesson?.fields?.price !== undefined ? { price: priceCents } : {}),
      ...(p.lesson?.fields?.note !== undefined ? { note: body?.comment || null } : {}),
      ...(p.lesson?.fields?.comment !== undefined ? { comment: body?.comment || null } : {}),
      ...(p.lesson?.fields?.status !== undefined ? { status: 'planned' } : {}),
      // на некоторых схемах могут быть channel/channelLink — не трогаем
    };

    const created = await p.lesson.create({ data });
    return { ok: true, id: created?.id };
  }

  /** Провести урок (идемпотентно) + перевод средств студент→преподаватель */
  @Patch('lessons/:id/done')
  async done(@Param('id') id: string) {
    const p: AnyRec = this.prisma as any;

    return await p.$transaction(async (tx: AnyRec) => {
      const lesson = await tx.lesson.findUnique({ where: { id } });
      if (!lesson) throw new BadRequestException('lesson_not_found');

      const statusNow = this.normStatus(lesson.status);
      if (statusNow === 'completed') {
        // Уже проведён — считаем успешным, деньги второй раз не трогаем
        return { ok: true, already: true };
      }
      if (statusNow === 'cancelled') {
        // Нельзя «провести» отменённый
        throw new BadRequestException('lesson_cancelled');
      }

      const priceCents = this.anyToCents(lesson.price);

      // Переводим деньги один раз в рамках транзакции
      if (priceCents > 0) {
        try {
          await tx.user.update({ where: { id: lesson.studentId }, data: { balance: { decrement: priceCents } } });
        } catch { /* баланс ученика может уйти в минус — допускаем */ }
        await tx.user.update({ where: { id: lesson.teacherId }, data: { balance: { increment: priceCents } } });
      }

      // Пишем «completed» (нижний регистр)
      await tx.lesson.update({ where: { id }, data: { status: 'completed' } });
      return { ok: true };
    });
  }

  /** Отменить урок */
  @Patch('lessons/:id/cancel')
  async cancel(@Param('id') id: string) {
    const p: AnyRec = this.prisma as any;
    try {
      await p.lesson.update({ where: { id }, data: { status: 'cancelled' } });
      return { ok: true };
    } catch {
      throw new BadRequestException('cannot_update_lesson');
    }
  }
}
