import { BadRequestException, Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';

/**
 * Map UI status => DB enum value from migration:
 * UI: planned | done | canceled
 * DB: planned | completed | cancelled
 */
function toDbStatus(s?: string): string | undefined {
  if (!s) return undefined;
  const v = (s || '').toLowerCase();
  if (v === 'planned') return 'planned';
  if (v === 'done') return 'completed';
  if (v === 'canceled' || v === 'cancelled') return 'cancelled';
  return undefined;
}

/** Конвертируем цену в копейках. Принимаем number|string (с запятой).
 *  Если значение < 10000 — трактуем как ₽ и умножаем на 100.
 */
function toMinor(value: any): number {
  if (value === null || value === undefined) return 0;
  const s = String(value).replace(',', '.').trim();
  if (!s) return 0;
  const n = Number(s);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return n < 10000 ? Math.round(n * 100) : Math.round(n);
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('teacher')
export class TeacherLessonsController {
  constructor(private prisma: PrismaService) {}

  @Get('me/lessons')
  @Roles('teacher')
  async listMyLessons(
    @Req() req: any,
    @Query('status') status?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    const teacherId = req.user.sub as string;
    const where: any = { teacherId };
    const st = toDbStatus(status);
    if (st) where.status = st;
    if (from) where.startsAt = { ...(where.startsAt || {}), gte: new Date(from) };
    if (to) where.startsAt = { ...(where.startsAt || {}), lte: new Date(to) };

    const take = Math.max(1, Math.min(Number(limit || 20), 50));
    const skip = (Math.max(1, Number(page || 1)) - 1) * take;

    return (this.prisma as any).lesson.findMany({
      where,
      orderBy: { startsAt: 'asc' },
      skip, take,
      include: { subject: true, student: { select: { id: true, login: true } } },
    });
  }

  @Post('me/lessons')
  @Roles('teacher')
  async createLesson(
    @Req() req: any,
    @Body() body: { studentId: string; subjectId: string; startsAt: string; durationMin: number; price: number | string; comment?: string },
  ) {
    const teacherId = req.user.sub as string;
    const startsAt = new Date(body.startsAt);
    if (isNaN(startsAt.getTime())) throw new BadRequestException('startsAt invalid');
    if (!body.studentId || !body.subjectId) throw new BadRequestException('studentId & subjectId required');
    if (!body.durationMin || Number(body.durationMin) <= 0) throw new BadRequestException('durationMin invalid');

    const priceMinor = toMinor(body.price);
    if (priceMinor <= 0) throw new BadRequestException('price required');

    const student = await this.prisma.user.findUnique({ where: { id: body.studentId } });
    if (!student || student.role !== 'student') throw new BadRequestException('student not found');

    const end = new Date(startsAt.getTime() + Number(body.durationMin) * 60000);

    const future = await (this.prisma as any).lesson.findMany({
      where: { teacherId, status: 'planned', startsAt: { gte: new Date(startsAt.getTime() - 6 * 3600 * 1000) } },
      take: 100,
      orderBy: { startsAt: 'desc' },
    });
    const overlap = future.some((l: any) => {
      const s = new Date(l.startsAt).getTime();
      const d = Number(l.duration ?? 0);
      const e = s + d * 60000;
      return startsAt.getTime() < e && s < end.getTime();
    });
    if (overlap) throw new BadRequestException('time overlap');

    const data: any = {
      teacherId,
      studentId: body.studentId,
      subjectId: body.subjectId,
      startsAt,
      duration: Number(body.durationMin),
      price: priceMinor,
      status: 'planned',
      channel: 'skype',
    };

    return (this.prisma as any).lesson.create({ data });
  }

  @Patch('me/lessons/:id/done')
  @Roles('teacher')
  async done(@Req() req: any, @Param('id') id: string) {
    const teacherId = req.user.sub as string;
    const lesson = await (this.prisma as any).lesson.findUnique({ where: { id } });
    if (!lesson || lesson.teacherId !== teacherId) throw new BadRequestException('lesson not found');

    if (lesson.status === 'completed') return lesson;

    const student = await this.prisma.user.findUnique({ where: { id: lesson.studentId } });
    const teacher = await this.prisma.user.findUnique({ where: { id: teacherId } });
    if (!student || !teacher) throw new BadRequestException('participants missing');

    if ((student.balance ?? 0) < (lesson.price ?? 0)) {
      throw new BadRequestException('Insufficient student balance');
    }

    const res = await (this.prisma as any).$transaction(async (tx: any) => {
      await tx.user.update({ where: { id: student.id }, data: { balance: { decrement: lesson.price } } });
      await tx.user.update({ where: { id: teacher.id }, data: { balance: { increment: lesson.price } } });

      try {
        await tx.balanceChange.createMany({
          data: [
            { userId: student.id, delta: -Number(lesson.price || 0), reason: `Lesson charge ${lesson.id}` },
            { userId: teacher.id, delta:  Number(lesson.price || 0), reason: `Lesson income ${lesson.id}` },
          ],
        });
      } catch {}

      return tx.lesson.update({ where: { id: lesson.id }, data: { status: 'completed' } });
    });

    return res;
  }

  @Patch('me/lessons/:id/cancel')
  @Roles('teacher')
  async cancel(@Req() req: any, @Param('id') id: string) {
    const teacherId = req.user.sub as string;
    const lesson = await (this.prisma as any).lesson.findUnique({ where: { id } });
    if (!lesson || lesson.teacherId !== teacherId) throw new BadRequestException('lesson not found');
    if (lesson.status === 'completed') throw new BadRequestException('already done');

    return (this.prisma as any).lesson.update({ where: { id }, data: { status: 'cancelled' } });
  }

  @Patch('me/lessons/:id/reschedule')
  @Roles('teacher')
  async reschedule(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { startsAt: string; durationMin?: number },
  ) {
    const teacherId = req.user.sub as string;
    const lesson = await (this.prisma as any).lesson.findUnique({ where: { id } });
    if (!lesson || lesson.teacherId !== teacherId) throw new BadRequestException('lesson not found');
    if (lesson.status !== 'planned') throw new BadRequestException('only planned can be rescheduled');

    const startsAt = new Date(body.startsAt);
    if (isNaN(startsAt.getTime())) throw new BadRequestException('startsAt invalid');
    const duration = Number(body.durationMin ?? lesson.duration ?? 0);
    const end = new Date(startsAt.getTime() + duration * 60000);

    const neighbors = await (this.prisma as any).lesson.findMany({
      where: {
        teacherId,
        status: 'planned',
        id: { not: lesson.id },
        startsAt: {
          gte: new Date(startsAt.getTime() - 6 * 3600 * 1000),
          lte: new Date(end.getTime() + 6 * 3600 * 1000),
        },
      },
      take: 100,
    });
    const overlap = neighbors.some((l: any) => {
      const s = new Date(l.startsAt).getTime();
      const d = Number(l.duration ?? 0);
      const e = s + d * 60000;
      return startsAt.getTime() < e && s < end.getTime();
    });
    if (overlap) throw new BadRequestException('time overlap');

    const data: any = { startsAt };
    if (body.durationMin) data.duration = Number(body.durationMin);
    return (this.prisma as any).lesson.update({ where: { id }, data });
  }
}
