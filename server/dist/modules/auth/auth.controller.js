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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma.service");
const jwt_1 = require("@nestjs/jwt");
const password_util_1 = require("./password.util");
let AuthController = class AuthController {
    prisma;
    jwt;
    constructor(prisma, jwt) {
        this.prisma = prisma;
        this.jwt = jwt;
    }
    async login(body, res) {
        const login = String(body?.login ?? '').trim();
        const password = String(body?.password ?? '');
        if (!login || !password) {
            throw new common_1.UnauthorizedException('invalid_credentials');
        }
        try {
            const user = await this.prisma.user.findFirst({
                where: { OR: [{ login }, { email: login }, { phone: login }] },
            });
            if (!user)
                throw new common_1.UnauthorizedException('invalid_credentials');
            const hash = user.passwordHash ?? user.password ?? user.hash ?? null;
            const ok = await (0, password_util_1.verifyPassword)(password, hash);
            if (!ok)
                throw new common_1.UnauthorizedException('invalid_credentials');
            const token = await this.jwt.signAsync({ sub: user.id, role: user.role }, { expiresIn: process.env.JWT_EXPIRES_IN || '7d', secret: process.env.JWT_SECRET });
            res.cookie('token', token, {
                httpOnly: true,
                sameSite: 'lax',
                path: '/',
                maxAge: 1000 * 60 * 60 * 24 * 7,
            });
            return {
                id: user.id,
                login: user.login,
                role: user.role,
                email: user.email ?? null,
                phone: user.phone ?? null,
                firstName: user.firstName ?? null,
                lastName: user.lastName ?? null,
                balance: user.balance ?? 0,
                createdAt: user.createdAt,
            };
        }
        catch (e) {
            throw new common_1.UnauthorizedException('invalid_credentials');
        }
    }
    async logout(res) {
        res.clearCookie('token', { path: '/' });
        return { ok: true };
    }
    async me(req) {
        const token = req?.cookies?.token;
        if (!token)
            throw new common_1.UnauthorizedException('unauthorized');
        try {
            const payload = await this.jwt.verifyAsync(token, { secret: process.env.JWT_SECRET });
            const user = await this.prisma.user.findUnique({ where: { id: payload?.sub } });
            if (!user)
                throw new common_1.UnauthorizedException('unauthorized');
            return {
                id: user.id,
                login: user.login,
                role: user.role,
                email: user.email ?? null,
                phone: user.phone ?? null,
                firstName: user.firstName ?? null,
                lastName: user.lastName ?? null,
                balance: user.balance ?? 0,
                createdAt: user.createdAt,
            };
        }
        catch {
            throw new common_1.UnauthorizedException('unauthorized');
        }
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('logout'),
    __param(0, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    (0, common_1.Get)('me'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "me", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map