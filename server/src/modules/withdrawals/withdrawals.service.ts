import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Prisma } from '@prisma/client';

type AnyRec = Record<string, any>;

function modelHasField(modelName: string, field: string): boolean {
  const models: any[] = ((Prisma as any)?.dmmf?.datamodel?.models ?? []);
  const m = models.find((mm: any) => mm.name === modelName);
  const fields: string[] = (m?.fields ?? []).map((f: any) => f.name);
  return fields.includes(field);
}

function toInt(v: any) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n);
}

@Injectable()
export class WithdrawalsService {
  constructor(private prisma: PrismaService) {}

  private wRepo(p: AnyRec) {
    return p.withdrawal || p.withdrawRequest || p.withdrawals || null;
  }

  /** Учитель создаёт заявку на вывод */
  async createTeacherRequest(teacherId: string, amount: number, notes: string) {
    const p: AnyRec = this.prisma as any;
    const repo = this.wRepo(p);
    if (!repo) throw new BadRequestException('withdrawals not supported');

    const amt = toInt(amount);
    if (!amt || amt <= 0) throw new BadRequestException('amount must be > 0');

    const w = await repo.create({
      data: {
        teacherId,
        amount: amt,
        notes: notes || '',
        status: 'pending',
      },
    });

    // 0-запись в журнал (совместимо с вашей BalanceChange без type/meta/role)
    try {
      const bc = p.balanceChange ?? p.transaction ?? p.financeTransaction;
      if (bc?.create) {
        await bc.create({
          data: {
            userId: teacherId,
            ...(bc === p.balanceChange
              ? { delta: 0, reason: `withdraw request ${amt}` }
              : { amount: 0, type: 'WITHDRAW_REQUEST', status: 'PENDING', comment: `withdraw request ${amt}` }),
          },
        });
      }
    } catch {}

    return w;
  }

  /** Учитель — список своих заявок */
  listTeacherRequests(teacherId: string, page = 1, limit = 20) {
    const p: AnyRec = this.prisma as any;
    const repo = this.wRepo(p);
    if (!repo) return [];
    const take = Math.max(1, Math.min(Number(limit || 20), 50));
    const skip = (Math.max(1, Number(page || 1)) - 1) * take;

    return repo.findMany({
      where: { teacherId },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }

  /** Админ — список заявок */
  async adminList(status?: string, page = 1, limit = 20) {
    const p: AnyRec = this.prisma as any;
    const repo = this.wRepo(p);
    if (!repo) return { items: [], page, limit, total: 0 };

    const where: any = {};
    if (status) where.status = status;

    const take = Math.max(1, Math.min(Number(limit || 20), 50));
    const skip = (Math.max(1, Number(page || 1)) - 1) * take;

    const [items, total] = await Promise.all([
      repo.findMany({
        where,
        include: { teacher: { select: { id: true, login: true, firstName: true, lastName: true } } },
        orderBy: { createdAt: 'desc' },
        skip, take,
      }),
      repo.count({ where }),
    ]);
    return { items, page, limit: take, total };
  }

  /** Админ — подтверждение заявки */
  async approve(id: string, adminId?: string) {
    const p: AnyRec = this.prisma as any;
    const repo = this.wRepo(p);
    if (!repo) throw new BadRequestException('withdrawals not supported');

    const w = await repo.findUnique({ where: { id } });
    if (!w) throw new BadRequestException('withdrawal not found');
    if ((w as any).status !== 'pending') throw new ConflictException('NOT_PENDING');

    return (this.prisma as any).$transaction(async (tx: AnyRec) => {
      const updData: any = { status: 'approved' };
      if (modelHasField('Withdrawal', 'resolvedAt')) updData.resolvedAt = new Date();
      if (modelHasField('Withdrawal', 'adminId') && adminId) updData.adminId = adminId;

      await tx.user.update({
        where: { id: (w as any).teacherId },
        data: { balance: { decrement: Number((w as any).amount || 0) } },
      });

      const bc = tx.balanceChange ?? tx.transaction ?? tx.financeTransaction;
      if (bc?.create) {
        await bc.create({
          data: {
            userId: (w as any).teacherId,
            ...(bc === tx.balanceChange
              ? { delta: -Number((w as any).amount || 0), reason: `withdraw approve ${(w as any).amount}` }
              : { amount: -Number((w as any).amount || 0), type: 'WITHDRAW_DONE', status: 'DONE', comment: 'withdrawal complete' }),
          },
        });
      }

      return tx[this.wRepo(tx) === tx.withdrawal ? 'withdrawal' : 'withdrawRequest']
        .update({ where: { id: (w as any).id }, data: updData });
    });
  }

  /** Админ — отклонение заявки */
  async reject(id: string, adminId?: string) {
    const p: AnyRec = this.prisma as any;
    const repo = this.wRepo(p);
    if (!repo) throw new BadRequestException('withdrawals not supported');

    const w = await repo.findUnique({ where: { id } });
    if (!w) throw new BadRequestException('withdrawal not found');
    if ((w as any).status !== 'pending') throw new ConflictException('NOT_PENDING');

    const updData: any = { status: 'rejected' };
    if (modelHasField('Withdrawal', 'resolvedAt')) updData.resolvedAt = new Date();
    if (modelHasField('Withdrawal', 'adminId') && adminId) updData.adminId = adminId;

    return repo.update({ where: { id: (w as any).id }, data: updData });
  }
}
