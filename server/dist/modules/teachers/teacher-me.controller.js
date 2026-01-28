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
exports.TeacherMeController = void 0;
const common_1 = require("@nestjs/common");
const jwt_guard_1 = require("../auth/jwt.guard");
const roles_decorator_1 = require("../common/roles.decorator");
const roles_guard_1 = require("../common/roles.guard");
const prisma_service_1 = require("../../prisma.service");
let TeacherMeController = class TeacherMeController {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    toNum(v, fb = 0) { const n = Number(v); return Number.isFinite(n) ? n : fb; }
    normStatus(s) {
        const x = String(s || '').toLowerCase();
        if (x === 'done' || x === 'completed')
            return 'completed';
        if (x === 'canceled' || x === 'cancelled')
            return 'cancelled';
        return 'planned';
    }
    anyToCents(v) {
        const n = Math.round(this.toNum(v, 0));
        if (!Number.isFinite(n) || n <= 0)
            return 0;
        return n >= 1000 ? n : n * 100;
    }
    async subjects(req) {
        const p = this.prisma;
        const userId = req.user?.id;
        let profileId = null;
        try {
            profileId = (await p.teacherProfile?.findFirst?.({ where: { userId }, select: { id: true } }))?.id ?? null;
        }
        catch { }
        let items = [];
        try {
            if (p.teacherSubject?.findMany) {
                const rows = await p.teacherSubject.findMany({
                    where: { OR: [...(profileId ? [{ teacherId: profileId }] : []), { teacherId: userId }] },
                    include: { subject: true },
                });
                items = rows.map((r) => ({
                    subjectId: r.subjectId ?? r.subject?.id,
                    name: r.subject?.name ?? r.subjectId,
                    price: this.toNum(r.price ?? 0),
                    durationMin: this.toNum(r.duration ?? r.durationMin ?? 60),
                }));
            }
        }
        catch { }
        if (!items.length) {
            try {
                const prof = await p.teacherProfile?.findFirst?.({
                    where: { userId },
                    include: { subjects: { include: { subject: true } } },
                });
                const list = prof?.subjects ?? [];
                items = list.map((r) => ({
                    subjectId: r.subjectId ?? r.subject?.id,
                    name: r.subject?.name ?? r.subjectId,
                    price: this.toNum(r.price ?? 0),
                    durationMin: this.toNum(r.duration ?? r.durationMin ?? 60),
                }));
            }
            catch { }
        }
        const uniq = new Map();
        for (const i of items) {
            const k = String(i.subjectId || '');
            if (k && !uniq.has(k))
                uniq.set(k, i);
        }
        return Array.from(uniq.values());
    }
    async students(q = '') {
        const p = this.prisma;
        const query = (q || '').trim();
        const where = { role: 'student', NOT: [{ login: { contains: '__deleted__' } }] };
        if (query) {
            where.OR = [
                { login: { contains: query, mode: 'insensitive' } },
                { firstName: { contains: query, mode: 'insensitive' } },
                { lastName: { contains: query, mode: 'insensitive' } },
                { phone: { contains: query } },
                { email: { contains: query, mode: 'insensitive' } },
            ];
        }
        try {
            const rows = await p.user.findMany({
                where, orderBy: { createdAt: 'desc' }, take: 20,
                select: { id: true, login: true, firstName: true, lastName: true, phone: true },
            });
            return rows.map((u) => ({
                id: u.id,
                label: [u.login, [u.lastName, u.firstName].filter(Boolean).join(' '), u.phone].filter(Boolean).join(' — '),
            }));
        }
        catch {
            return [];
        }
    }
    async myLessons(req) {
        const p = this.prisma;
        const teacherId = req.user?.id;
        const rows = await p.lesson.findMany({
            where: { teacherId },
            orderBy: { startsAt: 'asc' },
            include: {
                subject: true,
                student: { select: { id: true, login: true } },
            },
        });
        return rows.map((r) => {
            const durationMin = this.toNum(r.durationMin ?? r.duration ?? 0);
            const priceCents = this.anyToCents(r.price);
            return {
                id: r.id,
                teacherId: r.teacherId,
                studentId: r.studentId,
                subjectId: r.subjectId,
                startsAt: r.startsAt,
                durationMin,
                status: this.normStatus(r.status),
                channel: r.channel ?? null,
                channelLink: r.channelLink ?? null,
                note: r.note ?? r.comment ?? null,
                priceCents,
                subject: r.subject ? { id: r.subject.id, name: r.subject.name } : null,
                student: r.student ? { id: r.student.id, login: r.student.login } : null,
            };
        });
    }
    async createLesson(req, body) {
        const p = this.prisma;
        const teacherId = req.user?.id;
        const studentId = String(body?.studentId || '').trim();
        const subjectId = String(body?.subjectId || '').trim();
        const startsAtIso = String(body?.startsAt || '').trim();
        if (!studentId)
            throw new common_1.BadRequestException('studentId_required');
        if (!subjectId)
            throw new common_1.BadRequestException('subjectId_required');
        if (!startsAtIso)
            throw new common_1.BadRequestException('startsAt_required');
        const startsAt = new Date(startsAtIso);
        if (isNaN(startsAt.getTime()))
            throw new common_1.BadRequestException('startsAt_invalid');
        const durationMin = this.toNum(body?.durationMin ?? body?.duration ?? 60) || 60;
        const priceCents = this.anyToCents(body?.price);
        const data = {
            teacherId, studentId, subjectId, startsAt,
            ...(p.lesson?.fields?.durationMin !== undefined ? { durationMin } : {}),
            ...(p.lesson?.fields?.duration !== undefined ? { duration: durationMin } : {}),
            ...(p.lesson?.fields?.price !== undefined ? { price: priceCents } : {}),
            ...(p.lesson?.fields?.note !== undefined ? { note: body?.comment || null } : {}),
            ...(p.lesson?.fields?.comment !== undefined ? { comment: body?.comment || null } : {}),
            ...(p.lesson?.fields?.status !== undefined ? { status: 'planned' } : {}),
        };
        const created = await p.lesson.create({ data });
        return { ok: true, id: created?.id };
    }
    async done(id) {
        const p = this.prisma;
        return await p.$transaction(async (tx) => {
            const lesson = await tx.lesson.findUnique({ where: { id } });
            if (!lesson)
                throw new common_1.BadRequestException('lesson_not_found');
            const statusNow = this.normStatus(lesson.status);
            if (statusNow === 'completed') {
                return { ok: true, already: true };
            }
            if (statusNow === 'cancelled') {
                throw new common_1.BadRequestException('lesson_cancelled');
            }
            const priceCents = this.anyToCents(lesson.price);
            if (priceCents > 0) {
                try {
                    await tx.user.update({ where: { id: lesson.studentId }, data: { balance: { decrement: priceCents } } });
                }
                catch { }
                await tx.user.update({ where: { id: lesson.teacherId }, data: { balance: { increment: priceCents } } });
            }
            await tx.lesson.update({ where: { id }, data: { status: 'completed' } });
            return { ok: true };
        });
    }
    async cancel(id) {
        const p = this.prisma;
        try {
            await p.lesson.update({ where: { id }, data: { status: 'cancelled' } });
            return { ok: true };
        }
        catch {
            throw new common_1.BadRequestException('cannot_update_lesson');
        }
    }
};
exports.TeacherMeController = TeacherMeController;
__decorate([
    (0, common_1.Get)('subjects'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TeacherMeController.prototype, "subjects", null);
__decorate([
    (0, common_1.Get)('students'),
    __param(0, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TeacherMeController.prototype, "students", null);
__decorate([
    (0, common_1.Get)('lessons'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TeacherMeController.prototype, "myLessons", null);
__decorate([
    (0, common_1.Post)('lessons'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TeacherMeController.prototype, "createLesson", null);
__decorate([
    (0, common_1.Patch)('lessons/:id/done'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TeacherMeController.prototype, "done", null);
__decorate([
    (0, common_1.Patch)('lessons/:id/cancel'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TeacherMeController.prototype, "cancel", null);
exports.TeacherMeController = TeacherMeController = __decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('teacher'),
    (0, common_1.Controller)('teacher/me'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TeacherMeController);
//# sourceMappingURL=teacher-me.controller.js.map