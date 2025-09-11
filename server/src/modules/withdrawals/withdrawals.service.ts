import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Prisma } from '@prisma/client';

function modelHasField(modelName: string, field: string): boolean {
  const models: any[] = ((Prisma as any)?.dmmf?.datamodel?.models ?? []);
  const m = models.find((mm: any) => mm.name === modelName);
  const fields: string[] = (m?.fields ?? []).map((f: any) => f.name);
  return fields.includes(field);
}

@Injectable()
export class WithdrawalsService {
  constructor(private prisma: PrismaService) {}

  /** Учитель создаёт заявку на вывод */
  async createTeacherRequest(teacherId: string, amount: number, notes: string) {
    if (!amount || amount <= 0) {
      throw new BadRequestException('amount must be > 0');
    }

    const w = await (this.prisma as any).withdrawal.create({
      data: {
        teacherId,
        amount,
        notes: notes || '',
        status: 'pending',
      },
    });

    // 0-запись в журнал (совместимо с вашей BalanceChange без type/meta/role)
    const bc = (this.prisma as any).balanceChange ?? (this.prisma as any).transaction;
    if (bc?.create) {
      try {
        await bc.create({
          data: { userId: teacherId, delta: 0, reason: `withdraw request ${amount}` },
        });
      } catch {}
    }

    return w;
  }

  /** Учитель — список своих заявок */
  async listTeacherRequests(teacherId: string, page = 1, limit = 20) {
    const take = Math.max(1, Math.min(Number(limit || 20), 50));
    const skip = (Math.max(1, Number(page || 1)) - 1) * take;

    return (this.prisma as any).withdrawal.findMany({
      where: { teacherId },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }

  /** Админ — список заявок */
  async adminList(status?: string, page = 1, limit = 20) {
    const where: any = {};
    if (status) where.status = status;

    const take = Math.max(1, Math.min(Number(limit || 20), 50));
    const skip = (Math.max(1, Number(page || 1)) - 1) * take;

    return (this.prisma as any).withdrawal.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }

  /** Админ — апрув заявки */
  async approve(id: string, adminId?: string) {
    const prisma: any = this.prisma as any;

    const w = await prisma.withdrawal.findUnique({ where: { id } });
    if (!w) throw new BadRequestException('withdrawal not found');
    if (w.status !== 'pending') throw new ConflictException('NOT_PENDING');

    const teacher = await prisma.user.findUnique({ where: { id: w.teacherId } });
    if (!teacher) throw new BadRequestException('teacher not found');
    if (teacher.balance < w.amount) throw new ConflictException('insufficient balance');

    const updData: any = { status: 'approved' };
    if (modelHasField('Withdrawal', 'resolvedAt')) updData.resolvedAt = new Date();
    if (modelHasField('Withdrawal', 'adminId') && adminId) updData.adminId = adminId;

    return await prisma.$transaction(async (tx: any) => {
      await tx.user.update({
        where: { id: teacher.id },
        data: { balance: { decrement: w.amount } },
      });

      const bc = tx.balanceChange ?? tx.transaction;
      if (bc?.create) {
        await bc.create({
          data: { userId: teacher.id, delta: -w.amount, reason: `withdraw approve ${w.amount}` },
        });
      }

      return tx.withdrawal.update({ where: { id: w.id }, data: updData });
    });
  }

  /** Админ — отклонение заявки */
  async reject(id: string, adminId?: string) {
    const prisma: any = this.prisma as any;

    const w = await prisma.withdrawal.findUnique({ where: { id } });
    if (!w) throw new BadRequestException('withdrawal not found');
    if (w.status !== 'pending') throw new ConflictException('NOT_PENDING');

    const updData: any = { status: 'rejected' };
    if (modelHasField('Withdrawal', 'resolvedAt')) updData.resolvedAt = new Date();
    if (modelHasField('Withdrawal', 'adminId') && adminId) updData.adminId = adminId;

    return prisma.withdrawal.update({ where: { id: w.id }, data: updData });
  }
}
