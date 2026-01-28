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
exports.SettingsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_guard_1 = require("../auth/jwt.guard");
const roles_decorator_1 = require("../common/roles.decorator");
const roles_guard_1 = require("../common/roles.guard");
const prisma_service_1 = require("../../prisma.service");
let SettingsController = class SettingsController {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    repo(p) {
        return p.setting || p.settings || p.systemSetting || null;
    }
    async getOne(key) {
        if (!key)
            throw new common_1.BadRequestException('key is required');
        const p = this.prisma;
        const repo = this.repo(p);
        if (!repo)
            return { key, value: '' };
        try {
            const row = (await repo.findUnique?.({ where: { key } })) ||
                (await repo.findFirst?.({ where: { key } }));
            return { key, value: row?.value ?? '' };
        }
        catch {
            return { key, value: '' };
        }
    }
    async upsert(body) {
        const key = String(body?.key || '').trim();
        if (!key)
            throw new common_1.BadRequestException('key is required');
        const value = String(body?.value ?? '');
        const p = this.prisma;
        const repo = this.repo(p);
        if (!repo)
            return { ok: false };
        try {
            if (repo.upsert) {
                await repo.upsert({
                    where: { key },
                    update: { value },
                    create: { key, value },
                });
                return { ok: true };
            }
        }
        catch { }
        try {
            const old = (await repo.findUnique?.({ where: { key } })) ||
                (await repo.findFirst?.({ where: { key } }));
            if (old?.id && repo.update) {
                await repo.update({ where: { id: old.id }, data: { value } });
                return { ok: true };
            }
            if (repo.create) {
                await repo.create({ data: { key, value } });
                return { ok: true };
            }
        }
        catch { }
        return { ok: false };
    }
};
exports.SettingsController = SettingsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('key')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "getOne", null);
__decorate([
    (0, common_1.Put)(),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "upsert", null);
exports.SettingsController = SettingsController = __decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.Controller)('admin/settings'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SettingsController);
//# sourceMappingURL=settings.controller.js.map