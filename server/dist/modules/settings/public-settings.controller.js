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
exports.PublicSettingsController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma.service");
let PublicSettingsController = class PublicSettingsController {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    repo(p) {
        return p.setting || p.settings || p.systemSetting || null;
    }
    async get(key) {
        const p = this.prisma;
        if (!key)
            return { value: '' };
        const repo = this.repo(p);
        try {
            const row = (await repo?.findUnique?.({ where: { key } })) ||
                (await repo?.findFirst?.({ where: { key } }));
            return { value: row?.value ?? '' };
        }
        catch {
            return { value: '' };
        }
    }
};
exports.PublicSettingsController = PublicSettingsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('key')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PublicSettingsController.prototype, "get", null);
exports.PublicSettingsController = PublicSettingsController = __decorate([
    (0, common_1.Controller)('settings/public'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PublicSettingsController);
//# sourceMappingURL=public-settings.controller.js.map