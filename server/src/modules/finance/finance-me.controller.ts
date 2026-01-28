import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PrismaService } from '../../prisma.service';
import type { Request } from 'express';

type AnyRec = Record<string, any>;

@UseGuards(JwtAuthGuard)
@Controller('finance/me')
export class FinanceMeController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('balance')
  async balance(@Req() req: Request) {
    const p: AnyRec = this.prisma as any;
    const id = (req as any).user?.id || (req as any).user?.sub;
    try {
      const u = await p.user.findUnique({ where: { id }, select: { balance: true } });
      const b = Number(u?.balance ?? 0);
      return { balance: Number.isFinite(b) ? b : 0, currency: 'RUB' };
    } catch { return { balance: 0, currency: 'RUB' }; }
  }

  @Get('transactions')
  async tx(@Req() req: Request, @Query('page') pageStr = '1', @Query('limit') limitStr = '20') {
    const p: AnyRec = this.prisma as any;
    const id = (req as any).user?.id || (req as any).user?.sub;
    const page = Math.max(parseInt(pageStr) || 1, 1);
    const take = Math.min(Math.max(parseInt(limitStr) || 20, 1), 100);
    const skip = (page - 1) * take;
    try {
      if (p.transaction?.findMany) {
        const [items, total] = await Promise.all([
          p.transaction.findMany({ where: { userId: id }, orderBy: { createdAt: 'desc' }, skip, take }),
          p.transaction.count({ where: { userId: id } }),
        ]);
        return { items, total, page, limit: take };
      }
    } catch {}
    return { items: [], total: 0, page, limit: take };
  }
}
