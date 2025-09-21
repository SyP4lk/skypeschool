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
exports.TeacherLessonsController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma.service");
const jwt_guard_1 = require("../auth/jwt.guard");
const roles_decorator_1 = require("../common/roles.decorator");
const roles_guard_1 = require("../common/roles.guard");
function toDbStatus(s) {
    if (!s)
        return undefined;
    const v = (s || '').toLowerCase();
    if (v === 'planned')
        return 'planned';
    if (v === 'done')
        return 'completed';
    if (v === 'canceled' || v === 'cancelled')
        return 'cancelled';
    return undefined;
}
let TeacherLessonsController = class TeacherLessonsController {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listMyLessons(req, status, from, to, page = '1', limit = '20') {
        const teacherId = req.user.sub;
        const where = { teacherId };
        const st = toDbStatus(status);
        if (st)
            where.status = st;
        if (from)
            where.startsAt = { ...(where.startsAt || {}), gte: new Date(from) };
        if (to)
            where.startsAt = { ...(where.startsAt || {}), lte: new Date(to) };
        const take = Math.max(1, Math.min(Number(limit || 20), 50));
        const skip = (Math.max(1, Number(page || 1)) - 1) * take;
        return this.prisma.lesson.findMany({
            where,
            orderBy: { startsAt: 'asc' },
            skip, take,
            include: { subject: true, student: { select: { id: true, login: true } } },
        });
    }
    async createLesson(req, body) {
        const teacherId = req.user.sub;
        const startsAt = new Date(body.startsAt);
        if (isNaN(startsAt.getTime()))
            throw new common_1.BadRequestException('startsAt invalid');
        if (!body.studentId || !body.subjectId)
            throw new common_1.BadRequestException('studentId & subjectId required');
        if (!body.durationMin || body.durationMin <= 0)
            throw new common_1.BadRequestException('durationMin invalid');
        if (typeof body.price !== 'number')
            throw new common_1.BadRequestException('price required');
        const student = await this.prisma.user.findUnique({ where: { id: body.studentId } });
        if (!student || student.role !== 'student')
            throw new common_1.BadRequestException('student not found');
        const end = new Date(startsAt.getTime() + body.durationMin * 60000);
        const future = await this.prisma.lesson.findMany({
            where: { teacherId, status: 'planned', startsAt: { gte: new Date(startsAt.getTime() - 6 * 3600 * 1000) } },
            take: 100,
        });
        const overlap = future.some((l) => {
            const s = new Date(l.startsAt).getTime();
            const d = Number(l.duration ?? 0);
            const e = s + d * 60000;
            return startsAt.getTime() < e && s < end.getTime();
        });
        if (overlap)
            throw new common_1.BadRequestException('time overlap');
        const data = {
            teacherId,
            studentId: body.studentId,
            subjectId: body.subjectId,
            startsAt,
            duration: body.durationMin,
            price: body.price,
            status: 'planned',
            channel: 'skype',
        };
        return this.prisma.lesson.create({ data });
    }
    async done(req, id) {
        const teacherId = req.user.sub;
        const lesson = await this.prisma.lesson.findUnique({ where: { id } });
        if (!lesson || lesson.teacherId !== teacherId)
            throw new common_1.BadRequestException('lesson not found');
        if (lesson.status === 'completed')
            return lesson;
        const student = await this.prisma.user.findUnique({ where: { id: lesson.studentId } });
        const teacher = await this.prisma.user.findUnique({ where: { id: teacherId } });
        if (!student || !teacher)
            throw new common_1.BadRequestException('participants missing');
        if ((student.balance ?? 0) < (lesson.price ?? 0)) {
            throw new common_1.BadRequestException('Insufficient student balance');
        }
        const res = await this.prisma.$transaction(async (tx) => {
            await tx.user.update({ where: { id: student.id }, data: { balance: { decrement: lesson.price } } });
            await tx.user.update({ where: { id: teacher.id }, data: { balance: { increment: lesson.price } } });
            try {
                await tx.balanceChange.createMany({
                    data: [
                        { userId: student.id, delta: -lesson.price, reason: `Lesson charge ${lesson.id}` },
                        { userId: teacher.id, delta: lesson.price, reason: `Lesson income ${lesson.id}` },
                    ],
                });
            }
            catch (_) {
            }
            return tx.lesson.update({ where: { id: lesson.id }, data: { status: 'completed' } });
        });
        return res;
    }
    async cancel(req, id) {
        const teacherId = req.user.sub;
        const lesson = await this.prisma.lesson.findUnique({ where: { id } });
        if (!lesson || lesson.teacherId !== teacherId)
            throw new common_1.BadRequestException('lesson not found');
        if (lesson.status === 'completed')
            throw new common_1.BadRequestException('already done');
        return this.prisma.lesson.update({ where: { id }, data: { status: 'cancelled' } });
    }
    async reschedule(req, id, body) {
        const teacherId = req.user.sub;
        const lesson = await this.prisma.lesson.findUnique({ where: { id } });
        if (!lesson || lesson.teacherId !== teacherId)
            throw new common_1.BadRequestException('lesson not found');
        if (lesson.status !== 'planned')
            throw new common_1.BadRequestException('only planned can be rescheduled');
        const startsAt = new Date(body.startsAt);
        if (isNaN(startsAt.getTime()))
            throw new common_1.BadRequestException('startsAt invalid');
        const duration = Number(body.durationMin ?? lesson.duration ?? 0);
        const end = new Date(startsAt.getTime() + duration * 60000);
        const neighbors = await this.prisma.lesson.findMany({
            where: {
                teacherId,
                status: 'planned',
                id: { not: lesson.id },
                startsAt: {
                    gte: new Date(startsAt.getTime() - 6 * 3600 * 1000),
                    lte: new Date(end.getTime() + 6 * 3600 * 1000),
                },
            },
            take: 100,
        });
        const overlap = neighbors.some((l) => {
            const s = new Date(l.startsAt).getTime();
            const d = Number(l.duration ?? 0);
            const e = s + d * 60000;
            return startsAt.getTime() < e && s < end.getTime();
        });
        if (overlap)
            throw new common_1.BadRequestException('time overlap');
        const data = { startsAt };
        if (body.durationMin)
            data.duration = Number(body.durationMin);
        return this.prisma.lesson.update({ where: { id }, data });
    }
};
exports.TeacherLessonsController = TeacherLessonsController;
__decorate([
    (0, common_1.Get)('me/lessons'),
    (0, roles_decorator_1.Roles)('teacher'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('from')),
    __param(3, (0, common_1.Query)('to')),
    __param(4, (0, common_1.Query)('page')),
    __param(5, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], TeacherLessonsController.prototype, "listMyLessons", null);
__decorate([
    (0, common_1.Post)('me/lessons'),
    (0, roles_decorator_1.Roles)('teacher'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TeacherLessonsController.prototype, "createLesson", null);
__decorate([
    (0, common_1.Patch)('me/lessons/:id/done'),
    (0, roles_decorator_1.Roles)('teacher'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], TeacherLessonsController.prototype, "done", null);
__decorate([
    (0, common_1.Patch)('me/lessons/:id/cancel'),
    (0, roles_decorator_1.Roles)('teacher'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], TeacherLessonsController.prototype, "cancel", null);
__decorate([
    (0, common_1.Patch)('me/lessons/:id/reschedule'),
    (0, roles_decorator_1.Roles)('teacher'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], TeacherLessonsController.prototype, "reschedule", null);
exports.TeacherLessonsController = TeacherLessonsController = __decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('teacher'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TeacherLessonsController);
//# sourceMappingURL=teacher-lessons.controller.js.map