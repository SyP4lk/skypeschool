import { BadRequestException, Controller, Get, Param, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { PrismaService } from '../../prisma.service';
import type { Request } from 'express';
import * as fs from 'fs';
import * as path from 'path';

type AnyRec = Record<string, any>;

function normalizeStatus(s?: string | null) {
  const v = String(s || '').toUpperCase();
  if (v.includes('DONE') || v.includes('COMPLETE')) return 'DONE';
  if (v.includes('CANCEL')) return 'CANCELED';
  if (v.includes('PLAN')) return 'PLANNED';
  return v || 'PLANNED';
}

function tryLoadJson(...pathsArr: string[]) {
  for (const pth of pathsArr) {
    try {
      if (fs.existsSync(pth)) return JSON.parse(fs.readFileSync(pth, 'utf8') || '{}');
    } catch {}
  }
  return {};
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('student')
@Controller('student/me')
export class StudentMeController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('lessons')
  async myLessons(
    @Req() req: Request,
    @Query('status') status?: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    const studentId = (req as any).user.sub as string;

    const where: any = { studentId };
    const st = (status || '').toLowerCase();
    if (st === 'planned') where.status = 'planned';
    if (st === 'done' || st === 'completed') where.status = 'completed';
    if (st === 'canceled' || st === 'cancelled') where.status = 'cancelled';

    const take = Math.max(1, Math.min(Number(limit || 20), 50));
    const skip = (Math.max(1, Number(page || 1)) - 1) * take;

    let rows: any[] = [];
    try {
      rows = await (this.prisma as any).lesson.findMany({
        where,
        orderBy: { startsAt: st === 'planned' ? 'asc' : 'desc' },
        include: {
          subject: true,
          teacher: { select: { id: true, login: true, firstName: true, lastName: true } },
        },
        skip,
        take,
      });
    } catch {
      rows = [];
    }
    return rows.map((r: any) => ({
      id: r.id,
      startsAt: r.startsAt,
      duration: r.duration ?? r.durationMin ?? null,
      durationMin: r.duration ?? r.durationMin ?? null,
      price: Number(r.price ?? 0),
      status: normalizeStatus(r.status),
      subjectName: r.subject?.name ?? null,
      teacher: r.teacher ? { id: r.teacher.id, login: r.teacher.login, firstName: r.teacher.firstName, lastName: r.teacher.lastName } : null,
    }));
  }

  @Patch('lessons/:id/cancel')
  async cancelByStudent(@Req() req: Request, @Param('id') id: string) {
    const studentId = (req as any).user.sub as string;
    const lesson = await (this.prisma as any).lesson.findUnique({ where: { id } });
    if (!lesson || lesson.studentId !== studentId) throw new BadRequestException('lesson not found');
    if (lesson.status === 'completed') throw new BadRequestException('already done');

    const startsAt = new Date(lesson.startsAt).getTime();
    const now = Date.now();
    const eightHoursMs = 8 * 60 * 60 * 1000;
    if (startsAt - now < eightHoursMs) {
      throw new BadRequestException('too_late_to_cancel');
    }

    return (this.prisma as any).lesson.update({ where: { id }, data: { status: 'cancelled' } });
  }

  @Get('topup-text')
  async topupText() {
    const p: AnyRec = this.prisma as any;
    const keys = ['payment_instructions', 'topup_instructions', 'student_topup_text', 'topupText', 'topup_text'];

    for (const key of keys) {
      try {
        const row =
          (await p.setting?.findUnique?.({ where: { key } })) ||
          (await p.settings?.findUnique?.({ where: { key } })) ||
          (await p.systemSetting?.findUnique?.({ where: { key } }));
        const val = row?.value;
        if (val != null && String(val).trim()) return { text: String(val) };
      } catch {}
    }

    const fsObj =
      tryLoadJson(
        path.join(process.cwd(), 'public', 'settings.json'),
        path.join(process.cwd(), '..', 'public', 'settings.json'),
      ) || {};
    for (const key of keys) {
      const val = (fsObj as any)[key];
      if (val != null && String(val).trim()) return { text: String(val) };
    }
    return { text: '' };
  }
}
