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
exports.AdminSettingsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_guard_1 = require("../auth/jwt.guard");
const roles_guard_1 = require("../common/roles.guard");
const roles_decorator_1 = require("../common/roles.decorator");
const prisma_service_1 = require("../../prisma.service");
let AdminSettingsController = class AdminSettingsController {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async read(key = '') {
        const k = String(key || '').trim();
        if (!k)
            return { key: k, value: '' };
        const p = this.prisma;
        const tryFind = async () => {
            try {
                const one = await p.setting?.findUnique?.({ where: { key: k }, select: { value: true } });
                if (one?.value !== undefined)
                    return String(one.value ?? '');
            }
            catch { }
            try {
                const one = await p.appSetting?.findUnique?.({ where: { key: k }, select: { value: true } });
                if (one?.value !== undefined)
                    return String(one.value ?? '');
            }
            catch { }
            try {
                const one = await p.systemSetting?.findUnique?.({ where: { key: k }, select: { value: true } });
                if (one?.value !== undefined)
                    return String(one.value ?? '');
            }
            catch { }
            return null;
        };
        const val = await tryFind();
        return { key: k, value: val ?? '' };
    }
    async write(body) {
        const key = String(body?.key || '').trim();
        const value = String(body?.value ?? '');
        if (!key)
            return { ok: false };
        const p = this.prisma;
        const tryUpsert = async () => {
            try {
                if (p.setting?.upsert) {
                    await p.setting.upsert({ where: { key }, create: { key, value }, update: { value } });
                    return true;
                }
            }
            catch { }
            try {
                if (p.appSetting?.upsert) {
                    await p.appSetting.upsert({ where: { key }, create: { key, value }, update: { value } });
                    return true;
                }
            }
            catch { }
            try {
                if (p.systemSetting?.upsert) {
                    await p.systemSetting.upsert({ where: { key }, create: { key, value }, update: { value } });
                    return true;
                }
            }
            catch { }
            return false;
        };
        const ok = await tryUpsert();
        return { ok };
    }
};
exports.AdminSettingsController = AdminSettingsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('key')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminSettingsController.prototype, "read", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminSettingsController.prototype, "write", null);
exports.AdminSettingsController = AdminSettingsController = __decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.Controller)('admin/settings'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminSettingsController);
//# sourceMappingURL=admin-settings.controller.js.map