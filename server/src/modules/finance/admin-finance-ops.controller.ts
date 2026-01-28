import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { FinanceService } from './finance.service';
import { PrismaService } from '../../prisma.service';

type AnyRec = Record<string, any>;

function parseRub(v: any) {
  if (typeof v === 'string') v = v.replace(',', '.').trim();
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return n;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/finance')
export class AdminFinanceOpsController {
  constructor(
    private readonly finance: FinanceService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('ops')
  async ops(@Query() q: any) {
    return this.finance.ops(q || {});
  }

  @Post('adjust')
  async adjust(@Body() body: any) {
    const userId = String(body?.userId || '');
    const amountRub = parseRub(body?.amount);
    const comment = String(body?.comment || '');
    return this.finance.adjust(userId, amountRub, comment);
  }

  @Get('users')
  async users(@Query('q') q: string) {
    const p: AnyRec = this.prisma as any;
    const where: AnyRec = {
      NOT: { login: { contains: '__deleted__' } },
    };
    if (q && q.trim()) {
      const s = q.trim();
      where.OR = [
        { login: { contains: s, mode: 'insensitive' } },
        { firstName: { contains: s, mode: 'insensitive' } },
        { lastName: { contains: s, mode: 'insensitive' } },
        { email: { contains: s, mode: 'insensitive' } },
        { phone: { contains: s } },
      ];
    }
    const list = await p.user.findMany({
      where,
      select: { id: true, login: true, firstName: true, lastName: true, phone: true, email: true, role: true, balance: true },
      orderBy: [{ login: 'asc' }],
      take: 20,
    });
    return list;
  }
}
