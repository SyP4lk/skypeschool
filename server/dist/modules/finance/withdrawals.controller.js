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
exports.TeacherWithdrawalsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_guard_1 = require("../auth/jwt.guard");
const roles_guard_1 = require("../common/roles.guard");
const roles_decorator_1 = require("../common/roles.decorator");
const prisma_service_1 = require("../../prisma.service");
function toKop(v) {
    if (typeof v === 'string')
        v = v.replace(',', '.').trim();
    const n = Number(v);
    if (!Number.isFinite(n))
        return 0;
    return Math.round(n * 100);
}
let TeacherWithdrawalsController = class TeacherWithdrawalsController {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(req, body) {
        const teacherId = req?.user?.id || req?.user?.sub;
        const amountKop = toKop(body?.amount);
        if (!amountKop || amountKop <= 0)
            throw new common_1.BadRequestException('Некорректная сумма');
        const p = this.prisma;
        const wRepo = p.withdrawRequest || p.withdrawal || null;
        if (!wRepo)
            throw new common_1.BadRequestException('Модель заявок на вывод не найдена');
        const row = await wRepo.create({ data: { teacherId, amount: amountKop, status: 'pending' } });
        return { ok: true, id: row.id };
    }
};
exports.TeacherWithdrawalsController = TeacherWithdrawalsController;
__decorate([
    (0, roles_decorator_1.Roles)('teacher'),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TeacherWithdrawalsController.prototype, "create", null);
exports.TeacherWithdrawalsController = TeacherWithdrawalsController = __decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('withdrawals/teacher/me'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TeacherWithdrawalsController);
//# sourceMappingURL=withdrawals.controller.js.map