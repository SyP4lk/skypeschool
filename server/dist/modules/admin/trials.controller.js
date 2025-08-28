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
exports.AdminTrialsController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma.service");
const jwt_guard_1 = require("../auth/jwt.guard");
const roles_decorator_1 = require("../common/roles.decorator");
const roles_guard_1 = require("../common/roles.guard");
let AdminTrialsController = class AdminTrialsController {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async list(status) {
        const where = status ? { status } : {};
        const items = await this.prisma.trialRequest.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });
        return { items };
    }
    async setStatus(id, body) {
        const { status } = body || {};
        if (status !== 'new' && status !== 'processed') {
            throw new common_1.BadRequestException('status must be new|processed');
        }
        const row = await this.prisma.trialRequest.update({
            where: { id },
            data: { status },
        });
        return { id: row.id, status: row.status };
    }
};
exports.AdminTrialsController = AdminTrialsController;
__decorate([
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminTrialsController.prototype, "list", null);
__decorate([
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminTrialsController.prototype, "setStatus", null);
exports.AdminTrialsController = AdminTrialsController = __decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('admin/trial-requests'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminTrialsController);
//# sourceMappingURL=trials.controller.js.map