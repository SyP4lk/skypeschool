"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const argon2 = __importStar(require("argon2"));
let AdminUsersController = class AdminUsersController {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async list(q = '', role, pageStr = '1', limitStr = '20') {
        const page = Math.max(parseInt(pageStr) || 1, 1);
        const take = Math.min(Math.max(parseInt(limitStr) || 20, 1), 100);
        const skip = (page - 1) * take;
        const where = {};
        if (q)
            where.OR = [
                { login: { contains: q } },
                { email: { contains: q } },
                { phone: { contains: q } },
            ];
        if (role)
            where.role = role;
        where.AND = [...(where.AND || []), { NOT: { login: { contains: '__deleted__' } } }];
        const [items, total] = await Promise.all([
            this.prisma.user.findMany({
                where, skip, take, orderBy: { createdAt: 'desc' },
                select: {
                    id: true, login: true, role: true,
                    firstName: true, lastName: true,
                    phone: true, email: true,
                    balance: true, createdAt: true,
                },
            }),
            this.prisma.user.count({ where }),
        ]);
        return { items, total, page, limit: take };
    }
    async read(id) {
        const u = await this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true, login: true, role: true,
                firstName: true, lastName: true,
                createdAt: true, email: true, phone: true,
            },
        });
        if (!u)
            throw new common_1.NotFoundException('user_not_found');
        return { user: u };
    }
    async create(body = {}) {
        const { login, password, role, email, phone, firstName, lastName } = body || {};
        if (!login || !password || !role)
            throw new common_1.BadRequestException('login_password_role_required');
        const passwordHash = await argon2.hash(password);
        try {
            return await this.prisma.user.create({
                data: {
                    login, role, passwordHash,
                    email: email || null, phone: phone || null,
                    firstName: firstName || null, lastName: lastName || null,
                },
            });
        }
        catch (e) {
            if (e?.code === 'P2002') {
                const t = e?.meta?.target;
                const s = Array.isArray(t) ? t.join(',') : String(t || '');
                if (s.includes('login'))
                    throw new common_1.BadRequestException('login_taken');
                if (s.includes('email'))
                    throw new common_1.BadRequestException('email_taken');
                if (s.includes('phone'))
                    throw new common_1.BadRequestException('phone_taken');
                throw new common_1.BadRequestException('unique_constraint_violation');
            }
            throw e;
        }
    }
    async update(id, body = {}) {
        if (!body || typeof body !== 'object')
            throw new common_1.BadRequestException('empty_body');
        const data = {};
        if ('firstName' in body)
            data.firstName = body.firstName ?? null;
        if ('lastName' in body)
            data.lastName = body.lastName ?? null;
        if ('email' in body) {
            const e = (body.email ?? '').trim();
            data.email = e || null;
        }
        if ('phone' in body) {
            const p = (body.phone ?? '').trim();
            data.phone = p || null;
        }
        try {
            return await this.prisma.user.update({
                where: { id },
                data,
                select: {
                    id: true, login: true, role: true,
                    firstName: true, lastName: true,
                    email: true, phone: true,
                    createdAt: true,
                },
            });
        }
        catch (e) {
            if (e?.code === 'P2002')
                throw new common_1.BadRequestException('unique_constraint_violation');
            throw e;
        }
    }
    async changePassword(id, body = {}) {
        const pwdRaw = body?.newPassword ?? body?.password ?? '';
        const pwd = String(pwdRaw || '');
        if (pwd.length < 8)
            throw new common_1.BadRequestException('password_too_short');
        const passwordHash = await argon2.hash(pwd);
        return this.prisma.user.update({ where: { id }, data: { passwordHash } });
    }
    async balance(id) {
        try {
            const u = await this.prisma.user.findUnique({
                where: { id }, select: { balance: true },
            });
            return { balance: Number(u?.balance ?? 0), currency: 'RUB' };
        }
        catch {
            return { balance: 0, currency: 'RUB' };
        }
    }
    async remove(id) {
        const u = await this.prisma.user.findUnique({ where: { id }, select: { login: true } });
        if (!u)
            throw new common_1.NotFoundException('user_not_found');
        const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        await this.prisma.user.update({
            where: { id },
            data: { login: `${u.login}__deleted__${stamp}`.slice(0, 150) },
        });
        return { ok: true };
    }
};
exports.AdminUsersController = AdminUsersController;
__decorate([
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('q')),
    __param(1, (0, common_1.Query)('role')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminUsersController.prototype, "list", null);
__decorate([
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminUsersController.prototype, "read", null);
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
], AdminUsersController.prototype, "update", null);
__decorate([
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.Post)(':id/password'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminUsersController.prototype, "changePassword", null);
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