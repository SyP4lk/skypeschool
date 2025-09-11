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
exports.WithdrawalsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma.service");
const client_1 = require("@prisma/client");
function modelHasField(modelName, field) {
    const models = (client_1.Prisma?.dmmf?.datamodel?.models ?? []);
    const m = models.find((mm) => mm.name === modelName);
    const fields = (m?.fields ?? []).map((f) => f.name);
    return fields.includes(field);
}
let WithdrawalsService = class WithdrawalsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createTeacherRequest(teacherId, amount, notes) {
        if (!amount || amount <= 0) {
            throw new common_1.BadRequestException('amount must be > 0');
        }
        const w = await this.prisma.withdrawal.create({
            data: {
                teacherId,
                amount,
                notes: notes || '',
                status: 'pending',
            },
        });
        const bc = this.prisma.balanceChange ?? this.prisma.transaction;
        if (bc?.create) {
            try {
                await bc.create({
                    data: { userId: teacherId, delta: 0, reason: `withdraw request ${amount}` },
                });
            }
            catch { }
        }
        return w;
    }
    async listTeacherRequests(teacherId, page = 1, limit = 20) {
        const take = Math.max(1, Math.min(Number(limit || 20), 50));
        const skip = (Math.max(1, Number(page || 1)) - 1) * take;
        return this.prisma.withdrawal.findMany({
            where: { teacherId },
            orderBy: { createdAt: 'desc' },
            skip,
            take,
        });
    }
    async adminList(status, page = 1, limit = 20) {
        const where = {};
        if (status)
            where.status = status;
        const take = Math.max(1, Math.min(Number(limit || 20), 50));
        const skip = (Math.max(1, Number(page || 1)) - 1) * take;
        return this.prisma.withdrawal.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take,
        });
    }
    async approve(id, adminId) {
        const prisma = this.prisma;
        const w = await prisma.withdrawal.findUnique({ where: { id } });
        if (!w)
            throw new common_1.BadRequestException('withdrawal not found');
        if (w.status !== 'pending')
            throw new common_1.ConflictException('NOT_PENDING');
        const teacher = await prisma.user.findUnique({ where: { id: w.teacherId } });
        if (!teacher)
            throw new common_1.BadRequestException('teacher not found');
        if (teacher.balance < w.amount)
            throw new common_1.ConflictException('insufficient balance');
        const updData = { status: 'approved' };
        if (modelHasField('Withdrawal', 'resolvedAt'))
            updData.resolvedAt = new Date();
        if (modelHasField('Withdrawal', 'adminId') && adminId)
            updData.adminId = adminId;
        return await prisma.$transaction(async (tx) => {
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
    async reject(id, adminId) {
        const prisma = this.prisma;
        const w = await prisma.withdrawal.findUnique({ where: { id } });
        if (!w)
            throw new common_1.BadRequestException('withdrawal not found');
        if (w.status !== 'pending')
            throw new common_1.ConflictException('NOT_PENDING');
        const updData = { status: 'rejected' };
        if (modelHasField('Withdrawal', 'resolvedAt'))
            updData.resolvedAt = new Date();
        if (modelHasField('Withdrawal', 'adminId') && adminId)
            updData.adminId = adminId;
        return prisma.withdrawal.update({ where: { id: w.id }, data: updData });
    }
};
exports.WithdrawalsService = WithdrawalsService;
exports.WithdrawalsService = WithdrawalsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WithdrawalsService);
//# sourceMappingURL=withdrawals.service.js.map