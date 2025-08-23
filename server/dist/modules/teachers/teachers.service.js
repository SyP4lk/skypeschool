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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeachersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma.service");
const argon2 = require("argon2");
let TeachersService = class TeachersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAllSummary(opts) {
        const where = { isActive: true };
        if (opts?.subjectId) {
            where.teacherSubjects = { some: { subjectId: opts.subjectId } };
        }
        else if (opts?.categoryId) {
            where.teacherSubjects = { some: { subject: { categoryId: opts.categoryId } } };
        }
        const list = await this.prisma.teacherProfile.findMany({
            where,
            orderBy: [{ sortOrder: 'asc' }],
            select: {
                id: true,
                userId: true,
                aboutShort: true,
                photo: true,
                teacherSubjects: {
                    select: {
                        subject: { select: { id: true, name: true, slug: true } },
                        price: true,
                    },
                },
            },
        });
        return list.map((t) => ({
            id: t.id,
            userId: t.userId,
            aboutShort: t.aboutShort,
            photo: t.photo ?? null,
            subjects: t.teacherSubjects.map((ts) => ts.subject),
            priceRange: t.teacherSubjects.length
                ? {
                    min: Math.min(...t.teacherSubjects.map((x) => x.price)),
                    max: Math.max(...t.teacherSubjects.map((x) => x.price)),
                }
                : null,
        }));
    }
    async findOneDetail(id) {
        return this.prisma.teacherProfile.findUnique({
            where: { id },
            include: {
                teacherSubjects: { include: { subject: true } },
                user: { select: { login: true, firstName: true, lastName: true } },
            },
        });
    }
    async findAllForAdmin() {
        return this.prisma.teacherProfile.findMany({
            include: {
                user: { select: { id: true, login: true, firstName: true, lastName: true } },
            },
        });
    }
    async createTeacher(dto) {
        return await this.prisma.$transaction(async (tx) => {
            const hashed = await argon2.hash(dto.password);
            const user = await tx.user.create({
                data: {
                    login: dto.login,
                    passwordHash: hashed,
                    role: 'teacher',
                    firstName: dto.firstName,
                    lastName: dto.lastName,
                },
            });
            const profile = await tx.teacherProfile.create({
                data: {
                    userId: user.id,
                    aboutShort: dto.aboutShort ?? null,
                    photo: dto.photo ?? null,
                    isActive: true,
                },
            });
            if (dto.teacherSubjects && dto.teacherSubjects.length > 0) {
                await tx.teacherSubject.createMany({
                    data: dto.teacherSubjects.map((ts) => ({
                        teacherId: profile.id,
                        subjectId: ts.subjectId,
                        price: ts.price,
                        duration: ts.duration,
                    })),
                });
            }
            return { id: profile.id };
        });
    }
    async updateTeacher(id, dto) {
        await this.prisma.teacherProfile.update({
            where: { id },
            data: {
                aboutShort: dto.aboutShort ?? undefined,
                photo: dto.photo ?? undefined,
            },
        });
        if (dto.firstName || dto.lastName) {
            const profile = await this.prisma.teacherProfile.findUnique({ where: { id }, select: { userId: true } });
            if (profile) {
                await this.prisma.user.update({
                    where: { id: profile.userId },
                    data: {
                        firstName: dto.firstName ?? undefined,
                        lastName: dto.lastName ?? undefined,
                    },
                });
            }
        }
        if (dto.teacherSubjects) {
            await this.prisma.teacherSubject.deleteMany({ where: { teacherId: id } });
            if (dto.teacherSubjects.length > 0) {
                await this.prisma.teacherSubject.createMany({
                    data: dto.teacherSubjects.map((ts) => ({
                        teacherId: id,
                        subjectId: ts.subjectId,
                        price: ts.price,
                        duration: ts.duration,
                    })),
                });
            }
        }
        return { ok: true };
    }
    async removeTeacher(id) {
        await this.prisma.teacherProfile.update({
            where: { id },
            data: { isActive: false },
        });
        return { ok: true };
    }
};
exports.TeachersService = TeachersService;
exports.TeachersService = TeachersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TeachersService);
//# sourceMappingURL=teachers.service.js.map