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
exports.StudentsController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma.service");
const argon2 = __importStar(require("argon2"));
const jwt_guard_1 = require("../auth/jwt.guard");
const roles_decorator_1 = require("../common/roles.decorator");
const roles_guard_1 = require("../common/roles.guard");
let StudentsController = class StudentsController {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async list(q, limit) {
        const take = Math.max(1, Math.min(Number(limit ?? 20), 50));
        const search = (q ?? '').trim();
        return this.prisma.user.findMany({
            where: {
                role: 'student',
                NOT: { login: { contains: '__deleted__' } },
                ...(search
                    ? {
                        OR: [
                            { login: { contains: search, mode: 'insensitive' } },
                            { firstName: { contains: search, mode: 'insensitive' } },
                            { lastName: { contains: search, mode: 'insensitive' } },
                            { email: { contains: search, mode: 'insensitive' } },
                            { phone: { contains: search, mode: 'insensitive' } },
                        ],
                    }
                    : {}),
            },
            select: { id: true, login: true, firstName: true, lastName: true },
            orderBy: { createdAt: 'desc' },
            take,
        });
    }
    async create(body) {
        if (!body.login?.trim() || !body.password?.trim()) {
            throw new common_1.BadRequestException('login and password are required');
        }
        const login = body.login.trim().toLowerCase();
        const exists = await this.prisma.user.findUnique({ where: { login } });
        if (exists)
            throw new common_1.BadRequestException('user exists');
        const hash = await argon2.hash(body.password);
        const user = await this.prisma.user.create({
            data: {
                login,
                passwordHash: hash,
                role: 'student',
                firstName: body.firstName ?? null,
                lastName: body.lastName ?? null,
                tz: body.tz ?? undefined,
                studentProfile: { create: {} },
            },
            select: { id: true, login: true, role: true },
        });
        return user;
    }
    async update(id, data) {
        return this.prisma.user.update({ where: { id }, data });
    }
    async remove(id) {
        const u = await this.prisma.user.findUnique({ where: { id } });
        if (!u)
            return { ok: true };
        await this.prisma.studentProfile.deleteMany({ where: { userId: id } });
        const newLogin = `${u.login}__deleted__${Date.now()}`;
        const newPass = await argon2.hash(`deleted-${Date.now()}-${Math.random()}`);
        await this.prisma.user.update({
            where: { id },
            data: {
                login: newLogin,
                passwordHash: newPass,
                firstName: null,
                lastName: null,
                balance: 0,
            },
        });
        return { ok: true };
    }
};
exports.StudentsController = StudentsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('q')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], StudentsController.prototype, "list", null);
__decorate([
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], StudentsController.prototype, "create", null);
__decorate([
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], StudentsController.prototype, "update", null);
__decorate([
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StudentsController.prototype, "remove", null);
exports.StudentsController = StudentsController = __decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('students'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], StudentsController);
//# sourceMappingURL=students.controller.js.map