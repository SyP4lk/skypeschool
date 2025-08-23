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
const prisma_service_1 = require("../../prisma.service");
const jwt_guard_1 = require("../auth/jwt.guard");
const roles_decorator_1 = require("../common/roles.decorator");
const roles_guard_1 = require("../common/roles.guard");
let AdminFinanceController = class AdminFinanceController {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async adjust(body) {
        const user = await this.prisma.user.update({ where: { id: body.userId }, data: { balance: { increment: body.delta } } });
        await this.prisma.balanceChange.create({ data: { userId: body.userId, delta: body.delta, reason: body.reason, adminId: body.adminId || null } });
        return { ok: true, balance: user.balance };
    }
};
exports.AdminFinanceController = AdminFinanceController;
__decorate([
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.Post)('adjust'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminFinanceController.prototype, "adjust", null);
exports.AdminFinanceController = AdminFinanceController = __decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('admin/finance'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminFinanceController);
//# sourceMappingURL=finance.controller.js.map