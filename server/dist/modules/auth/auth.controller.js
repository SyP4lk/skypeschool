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
const auth_service_1 = require("./auth.service");
const local_guard_1 = require("./local.guard");
const jwt_guard_1 = require("./jwt.guard");
const argon2 = require("argon2");
const prisma_service_1 = require("../../prisma.service");
let AuthController = class AuthController {
    auth;
    prisma;
    constructor(auth, prisma) {
        this.auth = auth;
        this.prisma = prisma;
    }
    async login(req, res) {
        const token = await this.auth.sign({
            id: req.user.id,
            login: req.user.login,
            role: req.user.role,
        });
        const isHttps = process.env.NODE_ENV === 'production';
        res.cookie('token', token, {
            httpOnly: true,
            sameSite: isHttps ? 'none' : 'lax',
            secure: isHttps,
            path: '/',
            maxAge: 7 * 24 * 3600 * 1000,
        });
        return { ok: true, user: { id: req.user.id, login: req.user.login, role: req.user.role } };
    }
    async registerStudent(req, res) {
        const body = req.body || {};
        const login = (body.login ?? '').trim().toLowerCase();
        const password = (body.password ?? '').trim();
        const firstName = (body.firstName ?? null);
        const lastName = (body.lastName ?? null);
        if (!login || !password)
            throw new common_1.BadRequestException('login and password required');
        const exists = await this.prisma.user.findUnique({ where: { login } });
        if (exists)
            throw new common_1.BadRequestException('user exists');
        const user = await this.prisma.user.create({
            data: {
                login,
                firstName,
                lastName,
                role: 'student',
                passwordHash: await argon2.hash(password),
                studentProfile: { create: {} },
            },
        });
        const token = await this.auth.sign({ id: user.id, login: user.login, role: user.role });
        const isHttps = process.env.NODE_ENV === 'production';
        res.cookie('token', token, {
            httpOnly: true,
            sameSite: isHttps ? 'none' : 'lax',
            secure: isHttps,
            path: '/',
            maxAge: 7 * 24 * 3600 * 1000,
        });
        return { ok: true, user: { id: user.id, login: user.login, role: user.role } };
    }
    async logout(res) {
        res.clearCookie('token', { path: '/' });
        return { ok: true };
    }
    async me(req) {
        return this.auth.me(req.user.sub);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.UseGuards)(local_guard_1.LocalAuthGuard),
    (0, common_1.HttpCode)(200),
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('register-student'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "registerStudent", null);
__decorate([
    (0, common_1.Post)('logout'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Get)('me'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "me", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService, prisma_service_1.PrismaService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map