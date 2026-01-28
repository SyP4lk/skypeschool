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
const roles_decorator_1 = require("../common/roles.decorator");
const roles_guard_1 = require("../common/roles.guard");
const finance_service_1 = require("./finance.service");
const prisma_service_1 = require("../../prisma.service");
let AdminFinanceController = class AdminFinanceController {
    service;
    prisma;
    constructor(service, prisma) {
        this.service = service;
        this.prisma = prisma;
    }
    async users(q = '', limit = '20') {
        const search = String(q || '').trim();
        const lim = Math.min(Math.max(parseInt(String(limit)) || 20, 1), 50);
        const where = { login: { not: { contains: '__deleted__' } } };
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
    async adjust(body) {
        return this.service.adjust(body?.userId, Number(body?.amount || 0), body?.comment || '');
    }
    async ops(q) {
        return this.service.ops(q);
    }
    async complete(id) {
        const p = this.prisma;
        const wRepo = p.withdrawRequest || p.withdrawal || null;
        if (!wRepo)
            return { ok: false };
        const w = await wRepo.findUnique({ where: { id }, include: { teacher: true } });
        if (!w)
            return { ok: false };
        try {
            await wRepo.update({ where: { id }, data: { status: 'approved' } });
        }
        catch {
            try {
                await wRepo.update({ where: { id }, data: { status: 'DONE' } });
            }
            catch { }
        }
        try {
            await p.user.update({
                where: { id: w.teacherId },
                data: { balance: { decrement: Number(w.amount || 0) } },
            });
            const txRepo = this.service.repo?.(p);
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
            }
            else if (txRepo === 'balanceChange') {
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
        }
        catch { }
        return { ok: true };
    }
    async cancel(id) {
        const p = this.prisma;
        const wRepo = p.withdrawRequest || p.withdrawal || null;
        if (!wRepo)
            return { ok: false };
        try {
            await wRepo.update({ where: { id }, data: { status: 'rejected' } });
        }
        catch {
            try {
                await wRepo.update({ where: { id }, data: { status: 'CANCELED' } });
            }
            catch { }
        }
        return { ok: true };
    }
};
exports.AdminFinanceController = AdminFinanceController;
__decorate([
    (0, common_1.Get)('users'),
    __param(0, (0, common_1.Query)('q')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AdminFinanceController.prototype, "users", null);
__decorate([
    (0, common_1.Post)('adjust'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminFinanceController.prototype, "adjust", null);
__decorate([
    (0, common_1.Get)('ops'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminFinanceController.prototype, "ops", null);
__decorate([
    (0, common_1.Patch)('withdrawals/:id/complete'),
    (0, common_1.Post)('withdrawals/:id/complete'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminFinanceController.prototype, "complete", null);
__decorate([
    (0, common_1.Patch)('withdrawals/:id/cancel'),
    (0, common_1.Post)('withdrawals/:id/cancel'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminFinanceController.prototype, "cancel", null);
exports.AdminFinanceController = AdminFinanceController = __decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.Controller)('admin/finance'),
    __metadata("design:paramtypes", [finance_service_1.FinanceService, prisma_service_1.PrismaService])
], AdminFinanceController);
//# sourceMappingURL=admin-finance.controller.js.map