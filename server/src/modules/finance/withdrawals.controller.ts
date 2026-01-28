import { Body, Controller, Post, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { PrismaService } from '../../prisma.service';

type AnyRec = Record<string, any>;

function toKop(v: any) {
  if (typeof v === 'string') v = v.replace(',', '.').trim();
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('withdrawals/teacher/me')
export class TeacherWithdrawalsController {
  constructor(private readonly prisma: PrismaService) {}

  @Roles('teacher')
  @Post()
  async create(@Req() req: any, @Body() body: any) {
    const teacherId = req?.user?.id || req?.user?.sub;
    const amountKop = toKop(body?.amount);
    if (!amountKop || amountKop <= 0) throw new BadRequestException('Некорректная сумма');

    const p: AnyRec = this.prisma as any;
    const wRepo = p.withdrawRequest || p.withdrawal || null;
    if (!wRepo) throw new BadRequestException('Модель заявок на вывод не найдена');

    const row = await wRepo.create({ data: { teacherId, amount: amountKop, status: 'pending' } });
    return { ok: true, id: row.id };
  }
}
