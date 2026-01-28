import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { FinanceService } from './finance.service';
import { PrismaService } from '../../prisma.service';

type AnyRec = Record<string, any>;

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/finance')
export class AdminFinanceController {
  constructor(private readonly service: FinanceService, private readonly prisma: PrismaService) {}

  /** Search users for manual adjustment (returns array; exclude deleted) */
  @Get('users')
  async users(@Query('q') q = '', @Query('limit') limit = '20') {
    const search = String(q || '').trim();
    const lim = Math.min(Math.max(parseInt(String(limit)) || 20, 1), 50);
    const where: AnyRec = { login: { not: { contains: '__deleted__' } } };
    if (search) {
      where.OR = [
        { login: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    const users = await this.prisma.user.findMany({
      where,
      select: { id: true, login: true, firstName: true, lastName: true, phone: true, email: true, role: true, balance: true },
      take: lim,
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });
    return users;
  }

  /** Manual adjustment: amount in RUB */
  @Post('adjust')
  async adjust(@Body() body: { userId: string, amount: number, comment?: string }) {
    return this.service.adjust(body?.userId, Number(body?.amount || 0), body?.comment || '');
  }

  /** Unified ops feed with filters */
  @Get('ops')
  async ops(@Query() q: any) {
    return this.service.ops(q);
  }

  /** Complete a withdrawal: decrement teacher balance and mark approved; also write a journal entry */
  @Patch('withdrawals/:id/complete')
  @Post('withdrawals/:id/complete') // backward compatibility
  async complete(@Param('id') id: string) {
    const p: AnyRec = this.prisma as any;
    const wRepo = p.withdrawRequest || p.withdrawal || null;
    if (!wRepo) return { ok: false };

    const w = await wRepo.findUnique({ where: { id }, include: { teacher: true } });
    if (!w) return { ok: false };

    try {
      await wRepo.update({ where: { id }, data: { status: 'approved' } });
    } catch {
      try { await wRepo.update({ where: { id }, data: { status: 'DONE' } }); } catch {}
    }

    try {
      await p.user.update({
        where: { id: w.teacherId },
        data: { balance: { decrement: Number(w.amount || 0) } },
      });
      const txRepo = (this.service as any).repo?.(p);
      if (txRepo === 'transaction' || txRepo === 'financeTransaction') {
        await p[txRepo].create({
          data: {
            userId: w.teacherId,
            amount: -Number(w.amount || 0),
            type: 'WITHDRAW_DONE',
            status: 'DONE',
            comment: 'withdrawal complete',
          },
        });
      } else if (txRepo === 'balanceChange') {
        await p.balanceChange.create({
          data: {
            userId: w.teacherId,
            delta: -Number(w.amount || 0),
            reason: 'Withdrawal paid',
            type: (p?.$exists?.TxType && p?.TxType?.withdraw_paid) ? 'withdraw_paid' : undefined,
            meta: { withdrawalId: w.id },
          },
        });
      }
    } catch {}

    return { ok: true };
  }

  /** Cancel a withdrawal: mark rejected, do not touch balances */
  @Patch('withdrawals/:id/cancel')
  @Post('withdrawals/:id/cancel') // backward compatibility
  async cancel(@Param('id') id: string) {
    const p: AnyRec = this.prisma as any;
    const wRepo = p.withdrawRequest || p.withdrawal || null;
    if (!wRepo) return { ok: false };
    try {
      await wRepo.update({ where: { id }, data: { status: 'rejected' } });
    } catch {
      try { await wRepo.update({ where: { id }, data: { status: 'CANCELED' } }); } catch {}
    }
    return { ok: true };
  }
}
