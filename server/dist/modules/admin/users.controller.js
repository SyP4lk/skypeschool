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
exports.AdminUsersController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma.service");
const jwt_guard_1 = require("../auth/jwt.guard");
const roles_decorator_1 = require("../common/roles.decorator");
const roles_guard_1 = require("../common/roles.guard");
const argon2 = require("argon2");
let AdminUsersController = class AdminUsersController {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async list(role = 'all', query = '', offset = '0', limit = '50') {
        const where = {
            ...(role !== 'all' ? { role } : {}),
            ...(query ? { OR: [
                    { login: { contains: query, mode: 'insensitive' } },
                    { firstName: { contains: query, mode: 'insensitive' } },
                    { lastName: { contains: query, mode: 'insensitive' } },
                ] } : {}),
        };
        const [total, items] = await this.prisma.$transaction([
            this.prisma.user.count({ where }),
            this.prisma.user.findMany({
                where, orderBy: { createdAt: 'desc' },
                skip: Number(offset) || 0, take: Math.min(Number(limit) || 50, 200),
                select: { id: true, login: true, firstName: true, lastName: true, role: true, balance: true },
            }),
        ]);
        return { items, total };
    }
    async getOne(id) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: { id: true, login: true, firstName: true, lastName: true, role: true, balance: true, tz: true },
        });
        if (!user)
            throw new common_1.NotFoundException();
        return { user };
    }
    async create(body) {
        const { role, login } = body;
        if (!['student', 'teacher'].includes(role))
            throw new common_1.BadRequestException('role must be student|teacher');
        if (!login)
            throw new common_1.BadRequestException('login required');
        const exists = await this.prisma.user.findUnique({ where: { login } });
        if (exists)
            throw new common_1.BadRequestException('login already exists');
        const password = body.password && body.password.length >= 8
            ? body.password : Math.random().toString(36).slice(-10);
        const passwordHash = await argon2.hash(password);
        const user = await this.prisma.user.create({
            data: { login, passwordHash, role, firstName: body.firstName || null, lastName: body.lastName || null, tz: body.tz || 'Europe/Moscow' },
            select: { id: true, login: true, firstName: true, lastName: true, role: true, balance: true },
        });
        if (role === 'student')
            await this.prisma.studentProfile.create({ data: { userId: user.id } });
        else
            await this.prisma.teacherProfile.create({ data: { userId: user.id, isActive: true } });
        return { ok: true, user, newPassword: body.password ? undefined : password };
    }
    async updateNames(id, body) {
        const user = await this.prisma.user.update({
            where: { id }, data: { firstName: body.firstName ?? null, lastName: body.lastName ?? null },
            select: { id: true, login: true, firstName: true, lastName: true, role: true, balance: true },
        });
        return { user };
    }
    async setPassword(id, body) {
        const user = await this.prisma.user.findUnique({ where: { id }, select: { role: true } });
        if (!user)
            throw new common_1.NotFoundException();
        if (user.role === 'admin')
            throw new common_1.ForbiddenException('cannot change admin password here');
        const password = (body.newPassword || '').trim();
        if (!password || password.length < 8)
            throw new common_1.BadRequestException('Пароль минимум 8 символов');
        const passwordHash = await argon2.hash(password);
        await this.prisma.user.update({ where: { id }, data: { passwordHash } });
        return { ok: true };
    }
    async balance(id) {
        const row = await this.prisma.user.findUnique({ where: { id }, select: { balance: true } });
        if (!row)
            throw new common_1.NotFoundException();
        return { balance: row.balance };
    }
    async remove(id) {
        const row = await this.prisma.user.findUnique({ where: { id }, select: { id: true, role: true } });
        if (!row)
            throw new common_1.NotFoundException();
        if (row.role === 'admin')
            throw new common_1.ForbiddenException('cannot delete admin');
        await this.prisma.studentProfile.deleteMany({ where: { userId: id } });
        await this.prisma.teacherProfile.deleteMany({ where: { userId: id } });
        await this.prisma.user.delete({ where: { id } });
        return { ok: true };
    }
};
exports.AdminUsersController = AdminUsersController;
__decorate([
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('role')),
    __param(1, (0, common_1.Query)('query')),
    __param(2, (0, common_1.Query)('offset')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminUsersController.prototype, "list", null);
__decorate([
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminUsersController.prototype, "getOne", null);
__decorate([
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminUsersController.prototype, "create", null);
__decorate([
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminUsersController.prototype, "updateNames", null);
__decorate([
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.Post)(':id/password'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminUsersController.prototype, "setPassword", null);
__decorate([
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.Get)(':id/balance'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminUsersController.prototype, "balance", null);
__decorate([
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminUsersController.prototype, "remove", null);
exports.AdminUsersController = AdminUsersController = __decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('admin/users'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminUsersController);
//# sourceMappingURL=users.controller.js.map