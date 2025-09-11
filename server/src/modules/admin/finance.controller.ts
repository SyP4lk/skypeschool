import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { PrismaService } from '../../prisma.service';
import { WithdrawStatus } from '@prisma/client';

type AnyRec = Record<string, any>;
type WithdrawStatusValue = (typeof WithdrawStatus)[keyof typeof WithdrawStatus];

function toKopMaybe(raw: any) {
  const n = Number(raw ?? 0);
  if (!Number.isFinite(n)) return 0;
  // если прилетели рубли — умножаем на 100; если уже копейки (большие числа) — оставляем
  if (Math.abs(n) < 1000) return Math.round(n * 100);
  return Math.round(n);
}

function matchesQ(u: any, q: string) {
  if (!q) return true;
  const hay = [u?.login, u?.firstName, u?.lastName, u?.phone, u?.email]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return hay.includes(q.toLowerCase());
}

// Вход: PENDING | DONE | CANCELED -> БД: pending | approved | rejected
function toWithdrawStatusDb(
  s?: string | null,
): WithdrawStatusValue | undefined {
  if (!s) return undefined;
  const up = String(s).trim().toUpperCase();
  if (up === 'PENDING') return WithdrawStatus.pending;
  if (up === 'DONE') return WithdrawStatus.approved;
  if (up === 'CANCELED') return WithdrawStatus.rejected;

  // Толерантные алиасы
  if (/APPROVED|OK/.test(up)) return WithdrawStatus.approved;
  if (/REJECT|CANCEL/.test(up)) return WithdrawStatus.rejected;
  if (/PEND|WAIT/.test(up)) return WithdrawStatus.pending;

  return undefined;
}

// Обратная нормализация в UI-статус
function toUiStatus(db: WithdrawStatusValue | string | null | undefined) {
  if (db === WithdrawStatus.approved) return 'DONE';
  if (db === WithdrawStatus.rejected) return 'CANCELED';
  return 'PENDING';
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin')
export class AdminFinanceController {
  constructor(private readonly prisma: PrismaService) {}

  // === ЖУРНАЛ ОПЕРАЦИЙ ===
  @Get('finance/ops')
  async ops(@Query() q: any) {
    const p: AnyRec = this.prisma as any;

    const page = Math.max(parseInt(q?.page || '1') || 1, 1);
    const take = Math.min(Math.max(parseInt(q?.limit || '20') || 20, 1), 100);
    const skip = (page - 1) * take;

    const type = String(q?.type || '').trim().toUpperCase(); // MANUAL | WITHDRAW | (LESSON — убрали)
    const statusDb = toWithdrawStatusDb(q?.status); // фильтр для WITHDRAW
    const search = String(q?.q || '').trim();

    const entries: any[] = [];

    // MANUAL: из transaction или balanceChange
    try {
      if ((p as any).transaction) {
        const tx = await (p as any).transaction.findMany({
          include: {
            user: {
              select: {
                id: true,
                login: true,
                firstName: true,
                lastName: true,
                phone: true,
                email: true,
                role: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        });
        for (const t of tx) {
          const amt = Number((t as any).amount || 0);
          if (amt === 0) continue;
          if (t.user?.login?.includes?.('__deleted__')) continue;
          entries.push({
            id: t.id,
            kind: 'manual',
            type: amt >= 0 ? 'DEPOSIT' : 'WITHDRAW',
            status: 'DONE',
            amount: Math.abs(amt),
            createdAt: (t as any).createdAt,
            actor: t.user,
            meta: { comment: String((t as any).comment || '') },
          });
        }
      } else if ((p as any).balanceChange) {
        const bc = await (p as any).balanceChange.findMany({
          include: {
            user: {
              select: {
                id: true,
                login: true,
                firstName: true,
                lastName: true,
                phone: true,
                email: true,
                role: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        });
        for (const b of bc) {
          const delta = Number((b as any).delta || 0);
          if (delta === 0) continue;
          if (b.user?.login?.includes?.('__deleted__')) continue;
          // пропустим служебную запись "заявка на вывод"
          const reason = String((b as any).reason || '');
          if (/withdraw|вывод/i.test(reason) && /request|заявк/i.test(reason))
            continue;

          entries.push({
            id: b.id,
            kind: 'manual',
            type: delta >= 0 ? 'DEPOSIT' : 'WITHDRAW',
            status: 'DONE',
            amount: Math.abs(delta),
            createdAt: (b as any).createdAt,
            actor: (b as any).user,
            meta: { comment: reason },
          });
        }
      }
    } catch (e) {
      // глушим, если каких-то таблиц нет в схеме
    }

    // WITHDRAW: из withdrawRequest / withdrawal
    try {
      const repo = (p as any).withdrawRequest || (p as any).withdrawal;
      if (repo) {
        const where: AnyRec = {};
        if (statusDb) where.status = statusDb;

        const ws = await repo.findMany({
          include: {
            teacher: {
              select: {
                id: true,
                login: true,
                firstName: true,
                lastName: true,
                phone: true,
                email: true,
                role: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          where,
        });

        for (const w of ws) {
          if (w.teacher?.login?.includes?.('__deleted__')) continue;
          entries.push({
            id: (w as any).id,
            kind: 'withdraw',
            type: 'WITHDRAW',
            status: toUiStatus((w as any).status),
            amount: toKopMaybe((w as any).amount),
            createdAt: (w as any).createdAt,
            actor: (w as any).teacher,
            meta: { notes: (w as any).notes || null },
          });
        }
      }
    } catch (e) {
      // нет таблицы withdrawRequest — ок
    }

    // Применим остальные фильтры
    let items = entries;
    if (search)
      items = items.filter(
        (it) => matchesQ(it.actor, search) || matchesQ(it.counterpart, search),
      );
    if (type) {
      const byType: any = { MANUAL: 'manual', WITHDRAW: 'withdraw' };
      const kind = byType[type] || '';
      if (kind) items = items.filter((it) => it.kind === kind);
    }
    if (q?.status) {
      const st = String(q.status).toUpperCase();
      items = items.filter((it) => (it.kind === 'withdraw' ? it.status === st : true));
    }

    items.sort(
      (a, b) => +new Date(b.createdAt as any) - +new Date(a.createdAt as any),
    );

    const total = items.length;
    const pageItems = items.slice(skip, skip + take);
    return { items: pageItems, total, page, limit: take };
  }

  // === РУЧНАЯ КОРРЕКТИРОВКА (amount в рублях) ===
  @Post('finance/adjust')
  async adjust(@Body() body: any) {
    const userId = String(body?.userId || '');
    if (!userId) throw new BadRequestException('userId required');

    const amountRub = Number(body?.amount || 0);
    if (!Number.isFinite(amountRub) || !amountRub)
      throw new BadRequestException('amount required');

    const kopecks = Math.round(amountRub * 100);

    await (this.prisma as any).user.update({
      where: { id: userId },
      data: { balance: { increment: kopecks } },
    });

    // Запишем в любую доступную таблицу аудита
    try {
      if ((this.prisma as any).transaction) {
        await (this.prisma as any).transaction.create({
          data: {
            userId,
            amount: kopecks,
            type: 'MANUAL',
            status: 'DONE',
            comment: String(body?.comment || ''),
          },
        });
      } else if ((this.prisma as any).balanceChange) {
        await (this.prisma as any).balanceChange.create({
          data: {
            userId,
            delta: kopecks,
            reason: String(body?.comment || 'Admin manual adjustment'),
          },
        });
      }
    } catch (_) {}

    return { ok: true };
  }

  // === ПОИСК ПОЛЬЗОВАТЕЛЕЙ ДЛЯ АВТОКОМПЛИТА ===
  @Get('finance/users')
  async users(@Query('q') q: string) {
    const where: AnyRec = { NOT: { login: { contains: '__deleted__' } } };
    if (q && q.trim()) {
      const s = q.trim();
      (where as AnyRec).OR = [
        { login: { contains: s, mode: 'insensitive' } },
        { firstName: { contains: s, mode: 'insensitive' } },
        { lastName: { contains: s, mode: 'insensitive' } },
        { email: { contains: s, mode: 'insensitive' } },
        { phone: { contains: s } },
      ];
    }
    const users = await (this.prisma as any).user.findMany({
      where,
      select: {
        id: true,
        login: true,
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
        role: true,
        balance: true,
      },
      orderBy: { login: 'asc' },
      take: 20,
    });
    return users;
  }

  // === ЗАЯВКИ НА ВЫВОД ===
  @Post('finance/withdrawals/:id/complete')
  async complete(@Param('id') id: string) {
    const p: AnyRec = this.prisma as any;
    const repo = (p as any).withdrawRequest || (p as any).withdrawal;
    if (!repo) return { ok: false, error: 'withdraw repo not found' };

    const row = await repo.findUnique({ where: { id } });
    if (!row) return { ok: false, error: 'not_found' };
    if ((row as any).status === WithdrawStatus.approved) return { ok: true };

    const teacherId = (row as any).teacherId;
    const amount = Number((row as any).amount || 0);
    await p.user.update({
      where: { id: teacherId },
      data: { balance: { decrement: amount } },
    });

    await repo.update({
      where: { id },
      data: { status: WithdrawStatus.approved },
    });

    return { ok: true };
  }

  @Post('finance/withdrawals/:id/cancel')
  async cancel(@Param('id') id: string) {
    const p: AnyRec = this.prisma as any;
    const repo = (p as any).withdrawRequest || (p as any).withdrawal;
    if (!repo) return { ok: false, error: 'withdraw repo not found' };

    const row = await repo.findUnique({ where: { id } });
    if (!row) return { ok: false, error: 'not_found' };
    if ((row as any).status === WithdrawStatus.rejected) return { ok: true };

    await repo.update({
      where: { id },
      data: { status: WithdrawStatus.rejected },
    });

    return { ok: true };
  }
}
