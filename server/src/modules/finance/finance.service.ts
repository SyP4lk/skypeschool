import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

type AnyRec = Record<string, any>;

function toKop(rub: number) {
  if (rub === null || rub === undefined) return 0;
  const n = Number(rub);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

function toKopMaybe(raw: any) {
  const n = Number(raw ?? 0);
  if (!Number.isFinite(n)) return 0;
  // legacy rows may be stored in RUB; treat <1000 as RUB
  if (Math.abs(n) < 1000) return Math.round(n * 100);
  return Math.round(n); // already kopecks
}

function matchesQ(u: any, q: string) {
  if (!q) return true;
  const hay = [
    u?.login, u?.firstName, u?.lastName, u?.phone, u?.email
  ].filter(Boolean).join(' ').toLowerCase();
  return hay.includes(q.toLowerCase());
}

@Injectable()
export class FinanceService {
  constructor(private readonly prisma: PrismaService) {}

  repo(p: AnyRec) {
    if ((p as any).transaction) return 'transaction';
    if ((p as any).financeTransaction) return 'financeTransaction';
    if ((p as any).balanceChange) return 'balanceChange';
    return null;
  }

  async getBalance(userId: string) {
    try {
      const u = await this.prisma.user.findUnique({ where: { id: userId }, select: { balance: true } });
      return { balance: Number(u?.balance || 0), currency: 'RUB' };
    } catch {
      return { balance: 0, currency: 'RUB' };
    }
  }

  async adjust(userId: string, amountRub: number, comment?: string) {
    const p: AnyRec = this.prisma as any;
    const txRepo = this.repo(p);
    if (!userId) throw new BadRequestException('userId_required');
    const delta = toKop(amountRub);

    const u = await p.user.update({
      where: { id: userId },
      data: { balance: { increment: delta } },
      select: { id: true, login: true, balance: true },
    });

    try {
      if (txRepo === 'transaction' || txRepo === 'financeTransaction') {
        await p[txRepo].create({
          data: {
            userId: u.id,
            amount: delta,
            type: 'MANUAL',
            status: 'DONE',
            comment: comment || null,
          },
        });
      } else if (txRepo === 'balanceChange') {
        await p.balanceChange.create({
          data: {
            userId: u.id,
            delta,
            reason: comment || 'Admin manual adjustment',
          },
        });
      }
    } catch {}

    return { userId: u.id, balance: u.balance };
  }

  private mapWithdrawStatus(s: any): 'PENDING'|'DONE'|'CANCELED' {
    const v = String(s || '').toLowerCase();
    if (v.includes('approved') || v.includes('done') || v === 'ok') return 'DONE';
    if (v.includes('rejected') || v.includes('cancel')) return 'CANCELED';
    return 'PENDING';
  }

  /** Compose LESSON ops from balanceChange (+/- pairs) */
  private async deriveLessonOpsFromBalanceChanges(p: AnyRec) {
    const items: any[] = [];
    if (!(p as any).balanceChange) return items;
    try {
      const bc = await p.balanceChange.findMany({
        where: {
          OR: [
            { reason: { contains: 'lesson', mode: 'insensitive' } },
            { type: { equals: 'lesson', mode: 'insensitive' } as any },
          ],
        },
        include: { user: { select: { id: true, login: true, firstName: true, lastName: true, phone: true, email: true, role: true } } },
        orderBy: { createdAt: 'desc' },
        take: 800,
      });

      const pos: any[] = [];
      const neg: any[] = [];
      for (const b of bc) {
        const delta = Number((b as any).delta || 0);
        if (delta > 0) pos.push(b);
        else if (delta < 0) neg.push(b);
      }
      const usedPos = new Set<string>();
      const usedNeg = new Set<string>();
      const dtMin = (a: any, b: any) => Math.abs((+new Date(a) - +new Date(b)) / 60000);

      for (const pbc of pos) {
        if (usedPos.has(pbc.id)) continue;
        const amount = Math.abs(Number((pbc as any).delta || 0));
        let best: any = null;
        let bestIdx = -1;
        let bestDiff = 9999;
        for (let i=0;i<neg.length;i++) {
          const nbc = neg[i];
          if (usedNeg.has(nbc.id)) continue;
          if (Math.abs(Number((nbc as any).delta || 0)) !== amount) continue;
          if ((nbc as any).userId === (pbc as any).userId) continue;
          const diff = dtMin((nbc as any).createdAt, (pbc as any).createdAt);
          if (diff <= 30 && diff < bestDiff) { best = nbc; bestIdx = i; bestDiff = diff; }
        }
        if (best) {
          usedPos.add(pbc.id); usedNeg.add(best.id);
          items.push({
            id: `bc:${pbc.id}+${best.id}`,
            kind: 'lesson',
            type: 'LESSON',
            status: 'DONE',
            amount: Math.abs(Number((pbc as any).delta || 0)),
            createdAt: new Date(Math.max(+new Date((pbc as any).createdAt), +new Date((best as any).createdAt))).toISOString(),
            actor: (pbc as any).user,         // teacher (received)
            counterpart: (best as any).user,  // student (paid)
            meta: { source: 'balanceChange', pair: [pbc.id, best.id] },
          });
        }
      }
      // leftovers as single-sided
      for (const pbc of pos) {
        if (usedPos.has(pbc.id)) continue;
        items.push({
          id: `bc:${pbc.id}`,
          kind: 'lesson',
          type: 'LESSON',
          status: 'DONE',
          amount: Math.abs(Number((pbc as any).delta || 0)),
          createdAt: (pbc as any).createdAt,
          actor: (pbc as any).user,
          meta: { source: 'balanceChange' },
        });
      }
      for (const nbc of neg) {
        if (usedNeg.has(nbc.id)) continue;
        items.push({
          id: `bc:${nbc.id}`,
          kind: 'lesson',
          type: 'LESSON',
          status: 'DONE',
          amount: Math.abs(Number((nbc as any).delta || 0)),
          createdAt: (nbc as any).createdAt,
          actor: (nbc as any).user,
          meta: { source: 'balanceChange' },
        });
      }
    } catch {}
    return items;
  }

  /** Admin feed: MANUAL + WITHDRAW + LESSON (from lessons table + balanceChange pairs) */
  async ops(q: any) {
    const p: AnyRec = this.prisma as any;
    const txRepo = this.repo(p);

    const page = Math.max(parseInt(q?.page || '1') || 1, 1);
    const take = Math.min(Math.max(parseInt(q?.limit || '20') || 20, 1), 100);
    const skip = (page - 1) * take;
    const type = String(q?.type || '').trim().toUpperCase();      // MANUAL|LESSON|WITHDRAW or empty
    const status = String(q?.status || '').trim().toUpperCase();  // PENDING|DONE|CANCELED or empty
    const search = String(q?.q || '').trim();

    const effectiveType = type || (status ? 'WITHDRAW' : '');
    const entries: any[] = [];

    // MANUAL (skip zero & withdraw request noise)
    if (!effectiveType || effectiveType === 'MANUAL') {
      if (txRepo === 'transaction' || txRepo === 'financeTransaction') {
        try {
          const tx = await p[txRepo].findMany({
            where: {},
            include: { user: { select: { id: true, login: true, firstName: true, lastName: true, phone: true, email: true, role: true } } },
            orderBy: { createdAt: 'desc' },
          });
          for (const t of tx) {
            const actor = t.user;
            if (actor?.login?.includes?.('__deleted__')) continue;
            const amt = Number((t as any).amount || 0);
            const comment = String((t as any).comment || '');
            if (amt === 0) continue;
            if (/withdraw|вывод/i.test(comment) && /request|заявк/i.test(comment)) continue;
            entries.push({
              id: t.id,
              kind: 'manual',
              type: (amt >= 0 ? 'DEPOSIT' : 'WITHDRAW'),
              status: 'DONE',
              amount: Math.abs(amt),
              createdAt: (t as any).createdAt,
              actor,
              meta: { comment: comment || null },
            });
          }
        } catch {}
      }
      if (txRepo === 'balanceChange') {
        try {
          const bc = await p.balanceChange.findMany({
            where: {},
            include: { user: { select: { id: true, login: true, firstName: true, lastName: true, phone: true, email: true, role: true } } },
            orderBy: { createdAt: 'desc' },
          });
          for (const b of bc) {
            const actor = b.user;
            if (actor?.login?.includes?.('__deleted__')) continue;
            const delta = Number((b as any).delta || 0);
            const reason = String((b as any).reason || '');
            if (delta === 0) continue;
            if (reason.toLowerCase().includes('lesson')) continue; // will show in LESSON
            if (/withdraw|вывод/i.test(reason) && /request|заявк/i.test(reason)) continue;
            entries.push({
              id: b.id,
              kind: 'manual',
              type: (delta >= 0 ? 'DEPOSIT' : 'WITHDRAW'),
              status: 'DONE',
              amount: Math.abs(delta),
              createdAt: (b as any).createdAt,
              actor,
              meta: { comment: reason || null },
            });
          }
        } catch {}
      }
    }

    // WITHDRAW
    const wRepo = (p as any).withdrawRequest || (p as any).withdrawal || null;
    if ((!effectiveType || effectiveType === 'WITHDRAW') && wRepo) {
      try {
        const ws = await wRepo.findMany({
          where: status ? { status: status.toLowerCase() } : {},
          include: { teacher: { select: { id: true, login: true, firstName: true, lastName: true, phone: true, email: true, role: true } } },
          orderBy: { createdAt: 'desc' },
        });
        for (const w of ws) {
          const actor = (w as any).teacher;
          if (actor?.login?.includes?.('__deleted__')) continue;
          entries.push({
            id: (w as any).id,
            kind: 'withdraw',
            type: 'WITHDRAW',
            status: this.mapWithdrawStatus((w as any).status),
            amount: toKopMaybe((w as any).amount),
            createdAt: (w as any).createdAt,
            actor,
            meta: { notes: (w as any).notes || null },
          });
        }
      } catch {}
    }

    // LESSON from lessons table
    if (!effectiveType || effectiveType === 'LESSON') {
      try {
        const lessons = await (p as any).lesson.findMany({
          where: {
            OR: [
              { status: 'completed' }, { status: 'done' },
              { status: 'COMPLETED' }, { status: { contains: 'complete', mode: 'insensitive' } },
            ],
          },
          orderBy: { updatedAt: 'desc' },
          include: {
            teacher: { select: { id: true, login: true, firstName: true, lastName: true, phone: true, email: true, role: true } },
            student: { select: { id: true, login: true, firstName: true, lastName: true, phone: true, email: true, role: true } },
          },
          take: 800,
        });
        for (const l of lessons) {
          if (l.teacher?.login?.includes?.('__deleted__')) continue;
          if (l.student?.login?.includes?.('__deleted__')) continue;
          entries.push({
            id: (l as any).id,
            kind: 'lesson',
            type: 'LESSON',
            status: 'DONE',
            amount: toKopMaybe((l as any).price),
            createdAt: (l as any).updatedAt || (l as any).startsAt || (l as any).createdAt,
            actor: (l as any).teacher,
            counterpart: (l as any).student,
            meta: { subjectId: (l as any).subjectId, source: 'lesson' },
          });
        }
      } catch {}
      // plus derived from balanceChange
      try {
        const bcLessons = await this.deriveLessonOpsFromBalanceChanges(p);
        const key = (it: any) => `${it.actor?.id || ''}|${it.counterpart?.id || ''}|${it.amount}|${new Date(it.createdAt).toDateString()}`;
        const existing = new Map<string, any>();
        for (const it of entries) {
          if (it.kind === 'lesson') existing.set(key(it), it);
        }
        for (const it of bcLessons) {
          const k = key(it);
          if (!existing.has(k)) entries.push(it);
        }
      } catch {}
    }

    // === Final filters ===
    let items = entries;

    if (search) {
      items = items.filter((it) => matchesQ(it.actor, search) || matchesQ(it.counterpart, search));
    }
    if (type) {
      const byType: Record<string, string> = { MANUAL: 'manual', LESSON: 'lesson', WITHDRAW: 'withdraw' };
      const kind = byType[type] || '';
      if (kind) items = items.filter((it) => it.kind === kind);
    }
    if (status) {
      items = items.filter((it) => (it.kind === 'withdraw' ? it.status === status : true));
    }

    items.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    const total = items.length;
    const pageItems = items.slice(skip, skip + take);
    return { items: pageItems, total, page, limit: take };
  }

  /** Personal feed for current user */
  async listUserTransactions(userId: string, q: any) {
    const p: AnyRec = this.prisma as any;
    const txRepo = this.repo(p);
    const page = Math.max(parseInt(q?.page || '1') || 1, 1);
    const take = Math.min(Math.max(parseInt(q?.limit || '20') || 20, 1), 100);
    const skip = (page - 1) * take;
    const type = String(q?.type || '').trim().toUpperCase();
    const status = String(q?.status || '').trim().toUpperCase();

    const entries: any[] = [];

    // MANUAL
    if (!type || type === 'MANUAL') {
      if (txRepo === 'transaction' || txRepo === 'financeTransaction') {
        try {
          const tx = await p[txRepo].findMany({
            where: { userId },
            include: { user: { select: { id: true, login: true, firstName: true, lastName: true, phone: true, email: true, role: true } } },
            orderBy: { createdAt: 'desc' },
          });
          for (const t of tx) {
            const amt = Number((t as any).amount || 0);
            const comment = String((t as any).comment || '');
            if (amt === 0) continue;
            if (/withdraw|вывод/i.test(comment) && /request|заявк/i.test(comment)) continue;
            entries.push({
              id: t.id,
              kind: 'manual',
              type: (amt >= 0 ? 'DEPOSIT' : 'WITHDRAW'),
              status: 'DONE',
              amount: Math.abs(amt),
              createdAt: (t as any).createdAt,
              actor: t.user,
              meta: { comment: comment || null },
            });
          }
        } catch {}
      }
      if (txRepo === 'balanceChange') {
        try {
          const bc = await p.balanceChange.findMany({
            where: { userId },
            include: { user: { select: { id: true, login: true, firstName: true, lastName: true, phone: true, email: true, role: true } } },
            orderBy: { createdAt: 'desc' },
          });
          for (const b of bc) {
            const delta = Number((b as any).delta || 0);
            const reason = String((b as any).reason || '');
            if (delta === 0) continue;
            if (reason.toLowerCase().includes('lesson')) continue;
            if (/withdraw|вывод/i.test(reason) && /request|заявк/i.test(reason)) continue;
            entries.push({
              id: b.id,
              kind: 'manual',
              type: (delta >= 0 ? 'DEPOSIT' : 'WITHDRAW'),
              status: 'DONE',
              amount: Math.abs(delta),
              createdAt: (b as any).createdAt,
              actor: b.user,
              meta: { comment: reason || null },
            });
          }
        } catch {}
      }
    }

    // WITHDRAW (teacher)
    const wRepo = (p as any).withdrawRequest || (p as any).withdrawal || null;
    if (wRepo && (!type || type === 'WITHDRAW')) {
      try {
        const ws = await wRepo.findMany({
          where: { teacherId: userId, ...(status ? { status: status.toLowerCase() } : {}) },
          include: { teacher: { select: { id: true, login: true, firstName: true, lastName: true, phone: true, email: true, role: true } } },
          orderBy: { createdAt: 'desc' },
        });
        for (const w of ws) {
          entries.push({
            id: (w as any).id,
            kind: 'withdraw',
            type: 'WITHDRAW',
            status: this.mapWithdrawStatus((w as any).status),
            amount: toKopMaybe((w as any).amount),
            createdAt: (w as any).createdAt,
            actor: (w as any).teacher,
            meta: { notes: (w as any).notes || null },
          });
        }
      } catch {}
    }

    // LESSON: from lessons table
    if (!type || type === 'LESSON') {
      try {
        const lessons = await (p as any).lesson.findMany({
          where: {
            AND: [
              { OR: [
                { status: 'completed' }, { status: 'done' },
                { status: 'COMPLETED' }, { status: { contains: 'complete', mode: 'insensitive' } }
              ]},
              { OR: [{ teacherId: userId }, { studentId: userId }] },
            ]
          },
          orderBy: { updatedAt: 'desc' },
          include: {
            teacher: { select: { id: true, login: true, firstName: true, lastName: true, phone: true, email: true, role: true } },
            student: { select: { id: true, login: true, firstName: true, lastName: true, phone: true, email: true, role: true } },
          },
          take: 800,
        });
        for (const l of lessons) {
          const youAreTeacher = (l as any).teacherId === userId;
          entries.push({
            id: (l as any).id,
            kind: 'lesson',
            type: 'LESSON',
            status: 'DONE',
            amount: toKopMaybe((l as any).price),
            createdAt: (l as any).updatedAt || (l as any).startsAt || (l as any).createdAt,
            actor: youAreTeacher ? (l as any).teacher : (l as any).student,
            counterpart: youAreTeacher ? (l as any).student : (l as any).teacher,
            meta: { subjectId: (l as any).subjectId, role: youAreTeacher ? 'teacher' : 'student' },
          });
        }
      } catch {}
      // LESSON: derive from balanceChange pairs
      try {
        const bcLessons = await this.deriveLessonOpsFromBalanceChanges(p);
        for (const it of bcLessons) {
          if (it.actor?.id !== userId && it.counterpart?.id !== userId) continue;
          entries.push(it);
        }
      } catch {}
    }

    entries.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    const total = entries.length;
    const pageItems = entries.slice(skip, skip + take);
    return { items: pageItems, total, page, limit: take };
  }
}
