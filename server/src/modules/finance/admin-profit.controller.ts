// server/src/modules/finance/admin-profit.controller.ts
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { PrismaService } from '../../prisma.service';

type AnyRec = Record<string, any>;
function toDate(s?: string) {
  if (!s) return null;
  const t = Date.parse(s);
  return Number.isFinite(t) ? new Date(t) : null;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/finance')
export class AdminFinanceProfitController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('profit')
  async profit(@Query('from') fromStr?: string, @Query('to') toStr?: string) {
    const from = toDate(fromStr);
    const to = toDate(toStr) ? new Date(new Date(toStr!).setDate(new Date(toStr!).getDate() + 1)) : null;

    const where: AnyRec = { status: 'completed' };
    if (from || to) {
      // фильтруем по startsAt; при желании добавь OR по updatedAt
      where.startsAt = { ...(from ? { gte: from } : {}), ...(to ? { lt: to } : {}) };
    }

    const lessons = await this.prisma.lesson.findMany({
      where,
      select: {
        id: true,
        subjectId: true,
        teacherId: true,
        price: true,                 // teacherPrice
        publicPriceAtCharge: true,   // publicPrice
      },
    });

    // fallback-прайсы для старых уроков
    const pricing = await this.prisma.pricing.findMany({
      select: { teacherId: true, subjectId: true, teacherPrice: true, publicPrice: true },
    });
    const key = (t: string, s: string) => `${t}::${s}`;
    const pmap = new Map<string, { tp: number; pp: number }>();
    for (const p of pricing) {
      pmap.set(key(p.teacherId, p.subjectId), {
        tp: Number(p.teacherPrice || 0),
        pp: Number(p.publicPrice || 0),
      });
    }

    let total = 0;
    let count = 0;
    const bySubject = new Map<string, number>();

    for (const l of lessons) {
      const k = key(l.teacherId, l.subjectId);
      const fallback = pmap.get(k) || { tp: 0, pp: 0 };
      const teacherPrice = l.price != null ? Number(l.price) : fallback.tp;
      const publicPrice  = l.publicPriceAtCharge != null ? Number(l.publicPriceAtCharge) : fallback.pp;
      const fee = Math.max(0, publicPrice - teacherPrice);
      total += fee;
      count += 1;
      bySubject.set(l.subjectId, (bySubject.get(l.subjectId) || 0) + fee);
    }

    const top = [...bySubject.entries()].sort((a,b)=>b[1]-a[1]).slice(0,3);
    const subjects = top.length
      ? await this.prisma.subject.findMany({ where: { id: { in: top.map(([id]) => id) } }, select: { id:true, name:true } })
      : [];
    const bySubjectOut = top.map(([id, fee]) => ({ subjectId: id, title: subjects.find(s=>s.id===id)?.name || '—', fee }));

    const avgFee = count ? Math.round(total / count) : 0;
    return { total, lessons: count, avgFee, bySubject: bySubjectOut };
  }
  @Get('school-income')
async schoolIncome(@Query('from') fromStr?: string, @Query('to') toStr?: string) {
  return this.profit(fromStr, toStr);
}
}
