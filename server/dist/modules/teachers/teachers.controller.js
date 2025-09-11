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
exports.TeachersController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const argon2 = __importStar(require("argon2"));
const fs_1 = require("fs");
const path = __importStar(require("path"));
const crypto_1 = require("crypto");
const prisma_service_1 = require("../../prisma.service");
const jwt_guard_1 = require("../auth/jwt.guard");
const roles_decorator_1 = require("../common/roles.decorator");
const roles_guard_1 = require("../common/roles.guard");
let TeachersController = class TeachersController {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async saveUpload(file) {
        if (!file)
            return null;
        const uploadDir = path.join(process.cwd(), 'uploads');
        await fs_1.promises.mkdir(uploadDir, { recursive: true });
        const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg';
        const fileName = `${(0, crypto_1.randomUUID)()}${ext}`;
        await fs_1.promises.writeFile(path.join(uploadDir, fileName), file.buffer);
        return `/uploads/${fileName}`;
    }
    parseSubjects(raw) {
        try {
            const arr = JSON.parse(raw ?? '[]');
            if (!Array.isArray(arr))
                return [];
            return arr
                .map((s) => ({
                subjectId: String(s.subjectId),
                duration: Number(s.duration),
                price: Number(s.price),
            }))
                .filter((s) => s.subjectId && s.duration > 0 && s.price > 0);
        }
        catch {
            return [];
        }
    }
    async list() {
        return this.prisma.teacherProfile.findMany({
            include: {
                user: {
                    select: {
                        id: true,
                        login: true,
                        firstName: true,
                        lastName: true,
                        phone: true,
                        email: true,
                        balance: true,
                    },
                },
                teacherSubjects: { include: { subject: true } },
            },
        });
    }
    async one(id) {
        return this.prisma.teacherProfile.findUnique({
            where: { id },
            include: {
                user: true,
                teacherSubjects: { include: { subject: true } },
            },
        });
    }
    async create(file, body) {
        const hasUserId = !!body.userId;
        const hasCreds = !!body.login && !!body.password;
        if (!hasUserId && !hasCreds) {
            throw new common_1.BadRequestException('Provide userId OR login+password');
        }
        const subjects = this.parseSubjects(body.teacherSubjects);
        const photoPath = await this.saveUpload(file);
        return this.prisma.$transaction(async (tx) => {
            let userId = body.userId;
            if (!userId) {
                const passwordHash = await argon2.hash(String(body.password));
                const user = await tx.user.create({
                    data: {
                        login: String(body.login),
                        passwordHash,
                        role: 'teacher',
                        firstName: body.firstName ?? null,
                        lastName: body.lastName ?? null,
                        phone: body.phone ?? null,
                        email: body.email ?? null,
                    },
                });
                userId = user.id;
            }
            else {
                await tx.user.update({
                    where: { id: userId },
                    data: {
                        firstName: body.firstName ?? undefined,
                        lastName: body.lastName ?? undefined,
                        phone: body.phone ?? undefined,
                        email: body.email ?? undefined,
                    },
                });
            }
            const profile = await tx.teacherProfile.create({
                data: {
                    userId: userId,
                    aboutShort: body.aboutShort ?? null,
                    photo: photoPath,
                    contactVk: body.contactVk ?? null,
                    contactTelegram: body.contactTelegram ?? null,
                    contactWhatsapp: body.contactWhatsapp ?? null,
                    contactZoom: body.contactZoom ?? null,
                    contactTeams: body.contactTeams ?? null,
                    contactDiscord: body.contactDiscord ?? null,
                    contactMax: body.contactMax ?? null,
                },
            });
            for (const s of subjects) {
                await tx.teacherSubject.create({
                    data: {
                        teacherId: profile.id,
                        subjectId: s.subjectId,
                        duration: s.duration,
                        price: s.price,
                    },
                });
            }
            return {
                ok: true,
                profileId: profile.id,
                userId,
            };
        });
    }
    async update(id, file, body) {
        const subjects = this.parseSubjects(body.teacherSubjects);
        const photoPath = await this.saveUpload(file);
        return this.prisma.$transaction(async (tx) => {
            const current = await tx.teacherProfile.findUnique({
                where: { id },
                select: { userId: true },
            });
            if (!current)
                throw new common_1.BadRequestException('Teacher profile not found');
            const data = {
                aboutShort: body.aboutShort ?? undefined,
                contactVk: body.contactVk ?? undefined,
                contactTelegram: body.contactTelegram ?? undefined,
                contactWhatsapp: body.contactWhatsapp ?? undefined,
                contactZoom: body.contactZoom ?? undefined,
                contactTeams: body.contactTeams ?? undefined,
                contactDiscord: body.contactDiscord ?? undefined,
                contactMax: body.contactMax ?? undefined,
            };
            if (photoPath)
                data.photo = photoPath;
            await tx.teacherProfile.update({ where: { id }, data });
            if ('firstName' in body ||
                'lastName' in body ||
                'phone' in body ||
                'email' in body) {
                await tx.user.update({
                    where: { id: current.userId },
                    data: {
                        firstName: body.firstName ?? undefined,
                        lastName: body.lastName ?? undefined,
                        phone: body.phone ?? undefined,
                        email: body.email ?? undefined,
                    },
                });
            }
            if (Array.isArray(subjects) && subjects.length >= 0 && 'teacherSubjects' in body) {
                await tx.teacherSubject.deleteMany({ where: { teacherId: id } });
                for (const s of subjects) {
                    await tx.teacherSubject.create({
                        data: {
                            teacherId: id,
                            subjectId: s.subjectId,
                            duration: s.duration,
                            price: s.price,
                        },
                    });
                }
            }
            return { ok: true };
        });
    }
    async addSubject(teacherId, body) {
        if (!body?.subjectId || !body?.price || !body?.duration) {
            throw new common_1.BadRequestException('subjectId, price, duration required');
        }
        return this.prisma.teacherSubject.create({
            data: {
                teacherId,
                subjectId: body.subjectId,
                price: Number(body.price),
                duration: Number(body.duration),
            },
        });
    }
    async removeLink(linkId) {
        await this.prisma.teacherSubject.delete({ where: { id: linkId } });
        return { ok: true };
    }
    async removeProfile(id) {
        await this.prisma.$transaction(async (tx) => {
            await tx.teacherSubject.deleteMany({ where: { teacherId: id } });
            await tx.teacherProfile.delete({ where: { id } });
        });
        return { ok: true };
    }
};
exports.TeachersController = TeachersController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TeachersController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TeachersController.prototype, "one", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('photo')),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TeachersController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('photo')),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], TeachersController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/subjects'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TeachersController.prototype, "addSubject", null);
__decorate([
    (0, common_1.Delete)('subject-link/:linkId'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Param)('linkId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TeachersController.prototype, "removeLink", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TeachersController.prototype, "removeProfile", null);
exports.TeachersController = TeachersController = __decorate([
    (0, common_1.Controller)('teachers'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TeachersController);
//# sourceMappingURL=teachers.controller.js.map