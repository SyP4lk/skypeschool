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
exports.AdminOverviewController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma.service");
const jwt_guard_1 = require("../auth/jwt.guard");
const roles_decorator_1 = require("../common/roles.decorator");
const roles_guard_1 = require("../common/roles.guard");
let AdminOverviewController = class AdminOverviewController {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async overview() {
        const [negativeBalances, recentStudents] = await this.prisma.$transaction([
            this.prisma.user.count({ where: { balance: { lt: 0 } } }),
            this.prisma.user.findMany({
                where: { role: 'student' },
                orderBy: { createdAt: 'desc' },
                take: 5,
                select: { id: true, login: true, firstName: true, lastName: true, createdAt: true },
            }),
        ]);
        return {
            metrics: {
                todayLessons: 0,
                next7Lessons: 0,
                negativeBalances,
            },
            recentStudents: recentStudents.map(s => ({
                id: s.id,
                login: s.login,
                firstName: s.firstName,
                lastName: s.lastName,
                createdAt: s.createdAt.toISOString?.() ?? s.createdAt,
            })),
            recentChanges: [],
        };
    }
};
exports.AdminOverviewController = AdminOverviewController;
__decorate([
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.Get)('overview'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminOverviewController.prototype, "overview", null);
exports.AdminOverviewController = AdminOverviewController = __decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('admin'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminOverviewController);
//# sourceMappingURL=overview.controller.js.map