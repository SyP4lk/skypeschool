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
exports.FinanceMeController = void 0;
const common_1 = require("@nestjs/common");
const jwt_guard_1 = require("../auth/jwt.guard");
const prisma_service_1 = require("../../prisma.service");
let FinanceMeController = class FinanceMeController {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async balance(req) {
        const p = this.prisma;
        const id = req.user?.id || req.user?.sub;
        try {
            const u = await p.user.findUnique({ where: { id }, select: { balance: true } });
            const b = Number(u?.balance ?? 0);
            return { balance: Number.isFinite(b) ? b : 0, currency: 'RUB' };
        }
        catch {
            return { balance: 0, currency: 'RUB' };
        }
    }
    async tx(req, pageStr = '1', limitStr = '20') {
        const p = this.prisma;
        const id = req.user?.id || req.user?.sub;
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
        }
        catch { }
        return { items: [], total: 0, page, limit: take };
    }
};
exports.FinanceMeController = FinanceMeController;
__decorate([
    (0, common_1.Get)('balance'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FinanceMeController.prototype, "balance", null);
__decorate([
    (0, common_1.Get)('transactions'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], FinanceMeController.prototype, "tx", null);
exports.FinanceMeController = FinanceMeController = __decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('finance/me'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FinanceMeController);
//# sourceMappingURL=finance-me.controller.js.map