import { Controller, Get, Req, UseGuards } from '@nestjs/common';
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

function tryLoadJson(...paths: string[]) {
  for (const p of paths) {
    try {
      if (fs.existsSync(p)) {
        const txt = fs.readFileSync(p, 'utf8');
        return JSON.parse(txt || '{}');
      }
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
  async myLessons(@Req() req: Request) {
    const studentId = (req as any).user.sub as string;
    let rows: any[] = [];
    try {
      rows = await (this.prisma as any).lesson.findMany({
        where: { studentId },
        orderBy: { startsAt: 'asc' },
        include: {
          subject: true,
          teacher: { select: { id: true, login: true, firstName: true, lastName: true } },
        },
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

  /** Public topup instructions for Student LK
   *  Priority:
   *   1) DB settings tables with keys:
   *      'payment_instructions' | 'topup_instructions' | 'student_topup_text' | 'topupText' | 'topup_text'
   *   2) /public/settings.json (ищем и из cwd, и уровнем выше) по тем же ключам
   */
  @Get('topup-text')
  async topupText() {
    const p: AnyRec = this.prisma as any;
    const keys = ['payment_instructions', 'topup_instructions', 'student_topup_text', 'topupText', 'topup_text'];

    // 1) База (Setting/Settings/SystemSetting)
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

    // 2) Файл public/settings.json (cwd и ../public)
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
