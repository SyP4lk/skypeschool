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

function loadFS() {
  try {
    const file = path.join(process.cwd(), 'public', 'settings.json');
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, 'utf8') || '{}');
    }
  } catch {}
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
   *   1) settings/setting/systemSetting key = 'payment_instructions'
   *   2) legacy systemSetting key = 'student_topup_text'
   *   3) /public/settings.json { student_topup_text }
   */
  @Get('topup-text')
  async topupText() {
    const p: AnyRec = this.prisma as any;

    // 1) payment_instructions (new key for both admin & public)
    try {
      const row =
        (await p.setting?.findUnique?.({ where: { key: 'payment_instructions' } })) ||
        (await p.settings?.findUnique?.({ where: { key: 'payment_instructions' } })) ||
        (await p.systemSetting?.findUnique?.({ where: { key: 'payment_instructions' } }));
      if (row?.value != null) return { text: String(row.value) };
    } catch {}

    // 2) legacy
    try {
      const row = await p.systemSetting?.findUnique?.({ where: { key: 'student_topup_text' } });
      if (row?.value != null) return { text: String(row.value) };
    } catch {}

    // 3) fallback to file
    const fsObj = loadFS();
    return { text: String(fsObj.student_topup_text || '') };
  }
}
