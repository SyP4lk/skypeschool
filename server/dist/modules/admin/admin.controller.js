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
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma.service");
const jwt_guard_1 = require("../auth/jwt.guard");
const roles_decorator_1 = require("../common/roles.decorator");
const roles_guard_1 = require("../common/roles.guard");
let AdminController = class AdminController {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async overview() {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        const in7days = new Date(now.getTime() + 7 * 24 * 3600 * 1000);
        const [todayLessons, next7Lessons, negativeBalances, recentStudents, recentChanges] = await Promise.all([
            this.prisma.lesson.count({ where: { startsAt: { gte: startOfToday, lte: endOfToday } } }),
            this.prisma.lesson.count({ where: { startsAt: { gt: now, lte: in7days } } }),
            this.prisma.user.count({ where: { balance: { lt: 0 } } }),
            this.prisma.user.findMany({
                where: { role: 'student' },
                orderBy: { createdAt: 'desc' },
                take: 8,
                select: { id: true, login: true, firstName: true, lastName: true, createdAt: true },
            }),
            this.prisma.balanceChange.findMany({
                orderBy: { createdAt: 'desc' },
                take: 10,
                select: {
                    id: true,
                    delta: true,
                    reason: true,
                    createdAt: true,
                    user: { select: { id: true, login: true, firstName: true, lastName: true } },
                },
            }),
        ]);
        return {
            metrics: {
                todayLessons,
                next7Lessons,
                negativeBalances,
            },
            recentStudents,
            recentChanges,
        };
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.Get)('overview'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "overview", null);
exports.AdminController = AdminController = __decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('admin'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map