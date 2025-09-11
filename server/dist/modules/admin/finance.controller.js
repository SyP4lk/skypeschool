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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminFinanceController = void 0;
const common_1 = require("@nestjs/common");
const jwt_guard_1 = require("../auth/jwt.guard");
const roles_guard_1 = require("../common/roles.guard");
const roles_decorator_1 = require("../common/roles.decorator");
const prisma_service_1 = require("../../prisma.service");
const client_1 = require("@prisma/client");
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
    const hay = [u?.login, u?.firstName, u?.lastName, u?.phone, u?.email]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
    return hay.includes(q.toLowerCase());
}
function toWithdrawStatusDb(s) {
    if (!s)
        return undefined;
    const up = String(s).trim().toUpperCase();
    if (up === 'PENDING')
        return client_1.WithdrawStatus.pending;
    if (up === 'DONE')
        return client_1.WithdrawStatus.approved;
    if (up === 'CANCELED')
        return client_1.WithdrawStatus.rejected;
    if (/APPROVED|OK/.test(up))
        return client_1.WithdrawStatus.approved;
    if (/REJECT|CANCEL/.test(up))
        return client_1.WithdrawStatus.rejected;
    if (/PEND|WAIT/.test(up))
        return client_1.WithdrawStatus.pending;
    return undefined;
}
function toUiStatus(db) {
    if (db === client_1.WithdrawStatus.approved)
        return 'DONE';
    if (db === client_1.WithdrawStatus.rejected)
        return 'CANCELED';
    return 'PENDING';
}
let AdminFinanceController = class AdminFinanceController {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async ops(q) {
        const p = this.prisma;
        const page = Math.max(parseInt(q?.page || '1') || 1, 1);
        const take = Math.min(Math.max(parseInt(q?.limit || '20') || 20, 1), 100);
        const skip = (page - 1) * take;
        const type = String(q?.type || '').trim().toUpperCase();
        const statusDb = toWithdrawStatusDb(q?.status);
        const search = String(q?.q || '').trim();
        const entries = [];
        try {
            if (p.transaction) {
                const tx = await p.transaction.findMany({
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
                    const amt = Number(t.amount || 0);
                    if (amt === 0)
                        continue;
                    if (t.user?.login?.includes?.('__deleted__'))
                        continue;
                    entries.push({
                        id: t.id,
                        kind: 'manual',
                        type: amt >= 0 ? 'DEPOSIT' : 'WITHDRAW',
                        status: 'DONE',
                        amount: Math.abs(amt),
                        createdAt: t.createdAt,
                        actor: t.user,
                        meta: { comment: String(t.comment || '') },
                    });
                }
            }
            else if (p.balanceChange) {
                const bc = await p.balanceChange.findMany({
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
                    const delta = Number(b.delta || 0);
                    if (delta === 0)
                        continue;
                    if (b.user?.login?.includes?.('__deleted__'))
                        continue;
                    const reason = String(b.reason || '');
                    if (/withdraw|вывод/i.test(reason) && /request|заявк/i.test(reason))
                        continue;
                    entries.push({
                        id: b.id,
                        kind: 'manual',
                        type: delta >= 0 ? 'DEPOSIT' : 'WITHDRAW',
                        status: 'DONE',
                        amount: Math.abs(delta),
                        createdAt: b.createdAt,
                        actor: b.user,
                        meta: { comment: reason },
                    });
                }
            }
        }
        catch (e) {
        }
        try {
            const repo = p.withdrawRequest || p.withdrawal;
            if (repo) {
                const where = {};
                if (statusDb)
                    where.status = statusDb;
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
                    if (w.teacher?.login?.includes?.('__deleted__'))
                        continue;
                    entries.push({
                        id: w.id,
                        kind: 'withdraw',
                        type: 'WITHDRAW',
                        status: toUiStatus(w.status),
                        amount: toKopMaybe(w.amount),
                        createdAt: w.createdAt,
                        actor: w.teacher,
                        meta: { notes: w.notes || null },
                    });
                }
            }
        }
        catch (e) {
        }
        let items = entries;
        if (search)
            items = items.filter((it) => matchesQ(it.actor, search) || matchesQ(it.counterpart, search));
        if (type) {
            const byType = { MANUAL: 'manual', WITHDRAW: 'withdraw' };
            const kind = byType[type] || '';
            if (kind)
                items = items.filter((it) => it.kind === kind);
        }
        if (q?.status) {
            const st = String(q.status).toUpperCase();
            items = items.filter((it) => (it.kind === 'withdraw' ? it.status === st : true));
        }
        items.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
        const total = items.length;
        const pageItems = items.slice(skip, skip + take);
        return { items: pageItems, total, page, limit: take };
    }
    async adjust(body) {
        const userId = String(body?.userId || '');
        if (!userId)
            throw new common_1.BadRequestException('userId required');
        const amountRub = Number(body?.amount || 0);
        if (!Number.isFinite(amountRub) || !amountRub)
            throw new common_1.BadRequestException('amount required');
        const kopecks = Math.round(amountRub * 100);
        await this.prisma.user.update({
            where: { id: userId },
            data: { balance: { increment: kopecks } },
        });
        try {
            if (this.prisma.transaction) {
                await this.prisma.transaction.create({
                    data: {
                        userId,
                        amount: kopecks,
                        type: 'MANUAL',
                        status: 'DONE',
                        comment: String(body?.comment || ''),
                    },
                });
            }
            else if (this.prisma.balanceChange) {
                await this.prisma.balanceChange.create({
                    data: {
                        userId,
                        delta: kopecks,
                        reason: String(body?.comment || 'Admin manual adjustment'),
                    },
                });
            }
        }
        catch (_) { }
        return { ok: true };
    }
    async users(q) {
        const where = { NOT: { login: { contains: '__deleted__' } } };
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
        const users = await this.prisma.user.findMany({
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
    async complete(id) {
        const p = this.prisma;
        const repo = p.withdrawRequest || p.withdrawal;
        if (!repo)
            return { ok: false, error: 'withdraw repo not found' };
        const row = await repo.findUnique({ where: { id } });
        if (!row)
            return { ok: false, error: 'not_found' };
        if (row.status === client_1.WithdrawStatus.approved)
            return { ok: true };
        const teacherId = row.teacherId;
        const amount = Number(row.amount || 0);
        await p.user.update({
            where: { id: teacherId },
            data: { balance: { decrement: amount } },
        });
        await repo.update({
            where: { id },
            data: { status: client_1.WithdrawStatus.approved },
        });
        return { ok: true };
    }
    async cancel(id) {
        const p = this.prisma;
        const repo = p.withdrawRequest || p.withdrawal;
        if (!repo)
            return { ok: false, error: 'withdraw repo not found' };
        const row = await repo.findUnique({ where: { id } });
        if (!row)
            return { ok: false, error: 'not_found' };
        if (row.status === client_1.WithdrawStatus.rejected)
            return { ok: true };
        await repo.update({
            where: { id },
            data: { status: client_1.WithdrawStatus.rejected },
        });
        return { ok: true };
    }
};
exports.AdminFinanceController = AdminFinanceController;
__decorate([
    (0, common_1.Get)('finance/ops'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminFinanceController.prototype, "ops", null);
__decorate([
    (0, common_1.Post)('finance/adjust'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminFinanceController.prototype, "adjust", null);
__decorate([
    (0, common_1.Get)('finance/users'),
    __param(0, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminFinanceController.prototype, "users", null);
__decorate([
    (0, common_1.Post)('finance/withdrawals/:id/complete'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminFinanceController.prototype, "complete", null);
__decorate([
    (0, common_1.Post)('finance/withdrawals/:id/cancel'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminFinanceController.prototype, "cancel", null);
exports.AdminFinanceController = AdminFinanceController = __decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.Controller)('admin'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminFinanceController);
//# sourceMappingURL=finance.controller.js.map