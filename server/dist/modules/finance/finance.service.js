"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinanceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma.service");
function toKop(rub) {
    if (rub === null || rub === undefined)
        return 0;
    const n = Number(rub);
    if (!Number.isFinite(n))
        return 0;
    return Math.round(n * 100);
}
function toKopMaybe(raw) {
    const n = Number(raw ?? 0);
    if (!Number.isFinite(n))
        return 0;
    if (Math.abs(n) < 1000)
        return Math.round(n * 100);
    return Math.round(n);
}
function matchesQ(u, q) {
    if (!q)
        return true;
    const hay = [
        u?.login, u?.firstName, u?.lastName, u?.phone, u?.email
    ].filter(Boolean).join(' ').toLowerCase();
    return hay.includes(q.toLowerCase());
}
let FinanceService = class FinanceService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    repo(p) {
        if (p.transaction)
            return 'transaction';
        if (p.financeTransaction)
            return 'financeTransaction';
        if (p.balanceChange)
            return 'balanceChange';
        return null;
    }
    async getBalance(userId) {
        try {
            const u = await this.prisma.user.findUnique({ where: { id: userId }, select: { balance: true } });
            return { balance: Number(u?.balance || 0), currency: 'RUB' };
        }
        catch {
            return { balance: 0, currency: 'RUB' };
        }
    }
    async adjust(userId, amountRub, comment) {
        const p = this.prisma;
        const txRepo = this.repo(p);
        if (!userId)
            throw new common_1.BadRequestException('userId_required');
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
            }
            else if (txRepo === 'balanceChange') {
                await p.balanceChange.create({
                    data: {
                        userId: u.id,
                        delta,
                        reason: comment || 'Admin manual adjustment',
                    },
                });
            }
        }
        catch { }
        return { userId: u.id, balance: u.balance };
    }
    mapWithdrawStatus(s) {
        const v = String(s || '').toLowerCase();
        if (v.includes('approved') || v.includes('done') || v === 'ok')
            return 'DONE';
        if (v.includes('rejected') || v.includes('cancel'))
            return 'CANCELED';
        return 'PENDING';
    }
    async deriveLessonOpsFromBalanceChanges(p) {
        const items = [];
        if (!p.balanceChange)
            return items;
        try {
            const bc = await p.balanceChange.findMany({
                where: {
                    OR: [
                        { reason: { contains: 'lesson', mode: 'insensitive' } },
                        { type: { equals: 'lesson', mode: 'insensitive' } },
                    ],
                },
                include: { user: { select: { id: true, login: true, firstName: true, lastName: true, phone: true, email: true, role: true } } },
                orderBy: { createdAt: 'desc' },
                take: 800,
            });
            const pos = [];
            const neg = [];
            for (const b of bc) {
                const delta = Number(b.delta || 0);
                if (delta > 0)
                    pos.push(b);
                else if (delta < 0)
                    neg.push(b);
            }
            const usedPos = new Set();
            const usedNeg = new Set();
            const dtMin = (a, b) => Math.abs((+new Date(a) - +new Date(b)) / 60000);
            for (const pbc of pos) {
                if (usedPos.has(pbc.id))
                    continue;
                const amount = Math.abs(Number(pbc.delta || 0));
                let best = null;
                let bestIdx = -1;
                let bestDiff = 9999;
                for (let i = 0; i < neg.length; i++) {
                    const nbc = neg[i];
                    if (usedNeg.has(nbc.id))
                        continue;
                    if (Math.abs(Number(nbc.delta || 0)) !== amount)
                        continue;
                    if (nbc.userId === pbc.userId)
                        continue;
                    const diff = dtMin(nbc.createdAt, pbc.createdAt);
                    if (diff <= 30 && diff < bestDiff) {
                        best = nbc;
                        bestIdx = i;
                        bestDiff = diff;
                    }
                }
                if (best) {
                    usedPos.add(pbc.id);
                    usedNeg.add(best.id);
                    items.push({
                        id: `bc:${pbc.id}+${best.id}`,
                        kind: 'lesson',
                        type: 'LESSON',
                        status: 'DONE',
                        amount: Math.abs(Number(pbc.delta || 0)),
                        createdAt: new Date(Math.max(+new Date(pbc.createdAt), +new Date(best.createdAt))).toISOString(),
                        actor: pbc.user,
                        counterpart: best.user,
                        meta: { source: 'balanceChange', pair: [pbc.id, best.id] },
                    });
                }
            }
            for (const pbc of pos) {
                if (usedPos.has(pbc.id))
                    continue;
                items.push({
                    id: `bc:${pbc.id}`,
                    kind: 'lesson',
                    type: 'LESSON',
                    status: 'DONE',
                    amount: Math.abs(Number(pbc.delta || 0)),
                    createdAt: pbc.createdAt,
                    actor: pbc.user,
                    meta: { source: 'balanceChange' },
                });
            }
            for (const nbc of neg) {
                if (usedNeg.has(nbc.id))
                    continue;
                items.push({
                    id: `bc:${nbc.id}`,
                    kind: 'lesson',
                    type: 'LESSON',
                    status: 'DONE',
                    amount: Math.abs(Number(nbc.delta || 0)),
                    createdAt: nbc.createdAt,
                    actor: nbc.user,
                    meta: { source: 'balanceChange' },
                });
            }
        }
        catch { }
        return items;
    }
    async ops(q) {
        const p = this.prisma;
        const txRepo = this.repo(p);
        const page = Math.max(parseInt(q?.page || '1') || 1, 1);
        const take = Math.min(Math.max(parseInt(q?.limit || '20') || 20, 1), 100);
        const skip = (page - 1) * take;
        const type = String(q?.type || '').trim().toUpperCase();
        const status = String(q?.status || '').trim().toUpperCase();
        const search = String(q?.q || '').trim();
        const effectiveType = type || (status ? 'WITHDRAW' : '');
        const entries = [];
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
                        if (actor?.login?.includes?.('__deleted__'))
                            continue;
                        const amt = Number(t.amount || 0);
                        const comment = String(t.comment || '');
                        if (amt === 0)
                            continue;
                        if (/withdraw|вывод/i.test(comment) && /request|заявк/i.test(comment))
                            continue;
                        entries.push({
                            id: t.id,
                            kind: 'manual',
                            type: (amt >= 0 ? 'DEPOSIT' : 'WITHDRAW'),
                            status: 'DONE',
                            amount: Math.abs(amt),
                            createdAt: t.createdAt,
                            actor,
                            meta: { comment: comment || null },
                        });
                    }
                }
                catch { }
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
                        if (actor?.login?.includes?.('__deleted__'))
                            continue;
                        const delta = Number(b.delta || 0);
                        const reason = String(b.reason || '');
                        if (delta === 0)
                            continue;
                        if (reason.toLowerCase().includes('lesson'))
                            continue;
                        if (/withdraw|вывод/i.test(reason) && /request|заявк/i.test(reason))
                            continue;
                        entries.push({
                            id: b.id,
                            kind: 'manual',
                            type: (delta >= 0 ? 'DEPOSIT' : 'WITHDRAW'),
                            status: 'DONE',
                            amount: Math.abs(delta),
                            createdAt: b.createdAt,
                            actor,
                            meta: { comment: reason || null },
                        });
                    }
                }
                catch { }
            }
        }
        const wRepo = p.withdrawRequest || p.withdrawal || null;
        if ((!effectiveType || effectiveType === 'WITHDRAW') && wRepo) {
            try {
                const ws = await wRepo.findMany({
                    where: status ? { status: status.toLowerCase() } : {},
                    include: { teacher: { select: { id: true, login: true, firstName: true, lastName: true, phone: true, email: true, role: true } } },
                    orderBy: { createdAt: 'desc' },
                });
                for (const w of ws) {
                    const actor = w.teacher;
                    if (actor?.login?.includes?.('__deleted__'))
                        continue;
                    entries.push({
                        id: w.id,
                        kind: 'withdraw',
                        type: 'WITHDRAW',
                        status: this.mapWithdrawStatus(w.status),
                        amount: toKopMaybe(w.amount),
                        createdAt: w.createdAt,
                        actor,
                        meta: { notes: w.notes || null },
                    });
                }
            }
            catch { }
        }
        if (!effectiveType || effectiveType === 'LESSON') {
            try {
                const lessons = await p.lesson.findMany({
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
                    if (l.teacher?.login?.includes?.('__deleted__'))
                        continue;
                    if (l.student?.login?.includes?.('__deleted__'))
                        continue;
                    entries.push({
                        id: l.id,
                        kind: 'lesson',
                        type: 'LESSON',
                        status: 'DONE',
                        amount: toKopMaybe(l.price),
                        createdAt: l.updatedAt || l.startsAt || l.createdAt,
                        actor: l.teacher,
                        counterpart: l.student,
                        meta: { subjectId: l.subjectId, source: 'lesson' },
                    });
                }
            }
            catch { }
            try {
                const bcLessons = await this.deriveLessonOpsFromBalanceChanges(p);
                const key = (it) => `${it.actor?.id || ''}|${it.counterpart?.id || ''}|${it.amount}|${new Date(it.createdAt).toDateString()}`;
                const existing = new Map();
                for (const it of entries) {
                    if (it.kind === 'lesson')
                        existing.set(key(it), it);
                }
                for (const it of bcLessons) {
                    const k = key(it);
                    if (!existing.has(k))
                        entries.push(it);
                }
            }
            catch { }
        }
        let items = entries;
        if (search) {
            items = items.filter((it) => matchesQ(it.actor, search) || matchesQ(it.counterpart, search));
        }
        if (type) {
            const byType = { MANUAL: 'manual', LESSON: 'lesson', WITHDRAW: 'withdraw' };
            const kind = byType[type] || '';
            if (kind)
                items = items.filter((it) => it.kind === kind);
        }
        if (status) {
            items = items.filter((it) => (it.kind === 'withdraw' ? it.status === status : true));
        }
        items.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
        const total = items.length;
        const pageItems = items.slice(skip, skip + take);
        return { items: pageItems, total, page, limit: take };
    }
    async listUserTransactions(userId, q) {
        const p = this.prisma;
        const txRepo = this.repo(p);
        const page = Math.max(parseInt(q?.page || '1') || 1, 1);
        const take = Math.min(Math.max(parseInt(q?.limit || '20') || 20, 1), 100);
        const skip = (page - 1) * take;
        const type = String(q?.type || '').trim().toUpperCase();
        const status = String(q?.status || '').trim().toUpperCase();
        const entries = [];
        if (!type || type === 'MANUAL') {
            if (txRepo === 'transaction' || txRepo === 'financeTransaction') {
                try {
                    const tx = await p[txRepo].findMany({
                        where: { userId },
                        include: { user: { select: { id: true, login: true, firstName: true, lastName: true, phone: true, email: true, role: true } } },
                        orderBy: { createdAt: 'desc' },
                    });
                    for (const t of tx) {
                        const amt = Number(t.amount || 0);
                        const comment = String(t.comment || '');
                        if (amt === 0)
                            continue;
                        if (/withdraw|вывод/i.test(comment) && /request|заявк/i.test(comment))
                            continue;
                        entries.push({
                            id: t.id,
                            kind: 'manual',
                            type: (amt >= 0 ? 'DEPOSIT' : 'WITHDRAW'),
                            status: 'DONE',
                            amount: Math.abs(amt),
                            createdAt: t.createdAt,
                            actor: t.user,
                            meta: { comment: comment || null },
                        });
                    }
                }
                catch { }
            }
            if (txRepo === 'balanceChange') {
                try {
                    const bc = await p.balanceChange.findMany({
                        where: { userId },
                        include: { user: { select: { id: true, login: true, firstName: true, lastName: true, phone: true, email: true, role: true } } },
                        orderBy: { createdAt: 'desc' },
                    });
                    for (const b of bc) {
                        const delta = Number(b.delta || 0);
                        const reason = String(b.reason || '');
                        if (delta === 0)
                            continue;
                        if (reason.toLowerCase().includes('lesson'))
                            continue;
                        if (/withdraw|вывод/i.test(reason) && /request|заявк/i.test(reason))
                            continue;
                        entries.push({
                            id: b.id,
                            kind: 'manual',
                            type: (delta >= 0 ? 'DEPOSIT' : 'WITHDRAW'),
                            status: 'DONE',
                            amount: Math.abs(delta),
                            createdAt: b.createdAt,
                            actor: b.user,
                            meta: { comment: reason || null },
                        });
                    }
                }
                catch { }
            }
        }
        const wRepo = p.withdrawRequest || p.withdrawal || null;
        if (wRepo && (!type || type === 'WITHDRAW')) {
            try {
                const ws = await wRepo.findMany({
                    where: { teacherId: userId, ...(status ? { status: status.toLowerCase() } : {}) },
                    include: { teacher: { select: { id: true, login: true, firstName: true, lastName: true, phone: true, email: true, role: true } } },
                    orderBy: { createdAt: 'desc' },
                });
                for (const w of ws) {
                    entries.push({
                        id: w.id,
                        kind: 'withdraw',
                        type: 'WITHDRAW',
                        status: this.mapWithdrawStatus(w.status),
                        amount: toKopMaybe(w.amount),
                        createdAt: w.createdAt,
                        actor: w.teacher,
                        meta: { notes: w.notes || null },
                    });
                }
            }
            catch { }
        }
        if (!type || type === 'LESSON') {
            try {
                const lessons = await p.lesson.findMany({
                    where: {
                        AND: [
                            { OR: [
                                    { status: 'completed' }, { status: 'done' },
                                    { status: 'COMPLETED' }, { status: { contains: 'complete', mode: 'insensitive' } }
                                ] },
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
                    const youAreTeacher = l.teacherId === userId;
                    entries.push({
                        id: l.id,
                        kind: 'lesson',
                        type: 'LESSON',
                        status: 'DONE',
                        amount: toKopMaybe(l.price),
                        createdAt: l.updatedAt || l.startsAt || l.createdAt,
                        actor: youAreTeacher ? l.teacher : l.student,
                        counterpart: youAreTeacher ? l.student : l.teacher,
                        meta: { subjectId: l.subjectId, role: youAreTeacher ? 'teacher' : 'student' },
                    });
                }
            }
            catch { }
            try {
                const bcLessons = await this.deriveLessonOpsFromBalanceChanges(p);
                for (const it of bcLessons) {
                    if (it.actor?.id !== userId && it.counterpart?.id !== userId)
                        continue;
                    entries.push(it);
                }
            }
            catch { }
        }
        entries.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
        const total = entries.length;
        const pageItems = entries.slice(skip, skip + take);
        return { items: pageItems, total, page, limit: take };
    }
};
exports.FinanceService = FinanceService;
exports.FinanceService = FinanceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FinanceService);
//# sourceMappingURL=finance.service.js.map