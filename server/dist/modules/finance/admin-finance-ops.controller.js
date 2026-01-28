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
exports.AdminFinanceOpsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_guard_1 = require("../auth/jwt.guard");
const roles_guard_1 = require("../common/roles.guard");
const roles_decorator_1 = require("../common/roles.decorator");
const finance_service_1 = require("./finance.service");
const prisma_service_1 = require("../../prisma.service");
function parseRub(v) {
    if (typeof v === 'string')
        v = v.replace(',', '.').trim();
    const n = Number(v);
    if (!Number.isFinite(n))
        return 0;
    return n;
}
let AdminFinanceOpsController = class AdminFinanceOpsController {
    finance;
    prisma;
    constructor(finance, prisma) {
        this.finance = finance;
        this.prisma = prisma;
    }
    async ops(q) {
        return this.finance.ops(q || {});
    }
    async adjust(body) {
        const userId = String(body?.userId || '');
        const amountRub = parseRub(body?.amount);
        const comment = String(body?.comment || '');
        return this.finance.adjust(userId, amountRub, comment);
    }
    async users(q) {
        const p = this.prisma;
        const where = {
            NOT: { login: { contains: '__deleted__' } },
        };
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
        const list = await p.user.findMany({
            where,
            select: { id: true, login: true, firstName: true, lastName: true, phone: true, email: true, role: true, balance: true },
            orderBy: [{ login: 'asc' }],
            take: 20,
        });
        return list;
    }
};
exports.AdminFinanceOpsController = AdminFinanceOpsController;
__decorate([
    (0, common_1.Get)('ops'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminFinanceOpsController.prototype, "ops", null);
__decorate([
    (0, common_1.Post)('adjust'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminFinanceOpsController.prototype, "adjust", null);
__decorate([
    (0, common_1.Get)('users'),
    __param(0, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminFinanceOpsController.prototype, "users", null);
exports.AdminFinanceOpsController = AdminFinanceOpsController = __decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.Controller)('admin/finance'),
    __metadata("design:paramtypes", [finance_service_1.FinanceService,
        prisma_service_1.PrismaService])
], AdminFinanceOpsController);
//# sourceMappingURL=admin-finance-ops.controller.js.map