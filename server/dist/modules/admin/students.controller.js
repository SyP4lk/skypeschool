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
exports.AdminStudentsController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma.service");
const jwt_guard_1 = require("../auth/jwt.guard");
const roles_decorator_1 = require("../common/roles.decorator");
const roles_guard_1 = require("../common/roles.guard");
const argon2 = __importStar(require("argon2"));
const platform_express_1 = require("@nestjs/platform-express");
const path_1 = require("path");
const fs = __importStar(require("fs"));
const multer = require('multer');
function ensureDir(dir) {
    if (!fs.existsSync(dir))
        fs.mkdirSync(dir, { recursive: true });
}
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        const dir = 'public/uploads';
        try {
            ensureDir(dir);
            cb(null, dir);
        }
        catch (e) {
            cb(e, dir);
        }
    },
    filename: (_req, file, cb) => {
        const ext = (0, path_1.extname)(file.originalname || '').toLowerCase();
        const base = (file.originalname || 'avatar').replace(/\.[^/.]+$/, '');
        const safe = base.toLowerCase().replace(/[^a-z0-9-_]+/g, '-').slice(0, 50) ||
            'avatar';
        cb(null, `${Date.now()}-${safe}${ext}`);
    },
});
let AdminStudentsController = class AdminStudentsController {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getOne(id) {
        const user = await this.prisma.user.findFirst({
            where: { id, role: 'student' },
            select: {
                id: true,
                login: true,
                firstName: true,
                lastName: true,
                role: true,
                balance: true,
            },
        });
        if (!user)
            throw new common_1.NotFoundException('student not found');
        const profile = await this.prisma.studentProfile.findUnique({
            where: { userId: id },
        });
        return { user, profile };
    }
    async updateProfile(id, body) {
        const has = (k) => Object.prototype.hasOwnProperty.call(body, k);
        const userData = {};
        if (has('firstName'))
            userData.firstName = body.firstName ?? null;
        if (has('lastName'))
            userData.lastName = body.lastName ?? null;
        if (Object.keys(userData).length) {
            await this.prisma.user.update({ where: { id }, data: userData });
        }
        const profileUpdate = {};
        const setIfHas = (key) => {
            if (has(key))
                profileUpdate[key] = body[key] ?? null;
        };
        setIfHas('contactSkype');
        setIfHas('contactVk');
        setIfHas('contactGoogle');
        setIfHas('contactMax');
        setIfHas('contactDiscord');
        if (has('contactWhatsapp') || has('contactWhatsApp')) {
            profileUpdate.contactWhatsapp = body.contactWhatsapp ?? body.contactWhatsApp ?? null;
        }
        await this.prisma.studentProfile.upsert({
            where: { userId: id },
            update: profileUpdate,
            create: {
                userId: id,
                contactSkype: body.contactSkype ?? null,
                contactVk: body.contactVk ?? null,
                contactGoogle: body.contactGoogle ?? null,
                contactWhatsapp: body.contactWhatsapp ?? body.contactWhatsApp ?? null,
                contactMax: body.contactMax ?? null,
                contactDiscord: body.contactDiscord ?? null,
            },
        });
        return { ok: true };
    }
    async setPassword(id, body) {
        const password = (body.newPassword || '').trim();
        if (!password || password.length < 8) {
            throw new common_1.BadRequestException('Пароль минимум 8 символов');
        }
        const passwordHash = await argon2.hash(password);
        await this.prisma.user.update({ where: { id }, data: { passwordHash } });
        return { newPassword: password };
    }
    async uploadAvatar(id, file) {
        if (!file)
            throw new common_1.BadRequestException('Файл обязателен');
        const image = `/uploads/${file.filename}`;
        await this.prisma.studentProfile.upsert({
            where: { userId: id },
            update: { avatar: image },
            create: { userId: id, avatar: image },
        });
        return { ok: true, image };
    }
};
exports.AdminStudentsController = AdminStudentsController;
__decorate([
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminStudentsController.prototype, "getOne", null);
__decorate([
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminStudentsController.prototype, "updateProfile", null);
__decorate([
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.Post)(':id/password'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminStudentsController.prototype, "setPassword", null);
__decorate([
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.Post)(':id/avatar'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage,
        limits: { fileSize: 5 * 1024 * 1024 },
    })),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminStudentsController.prototype, "uploadAvatar", null);
exports.AdminStudentsController = AdminStudentsController = __decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('admin/students'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminStudentsController);
//# sourceMappingURL=students.controller.js.map