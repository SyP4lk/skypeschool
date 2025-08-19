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
exports.LessonsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma.service");
const client_1 = require("@prisma/client");
const ALLOWED_DURATIONS = new Set([45, 60, 90]);
function normalizeChannel(ch) {
    switch ((ch || 'skype').toLowerCase()) {
        case 'zoom': return client_1.$Enums.LessonChannel.zoom;
        case 'whatsapp': return client_1.$Enums.LessonChannel.whatsapp;
        case 'telegram': return client_1.$Enums.LessonChannel.telegram;
        case 'other': return client_1.$Enums.LessonChannel.other;
        case 'skype':
        default: return client_1.$Enums.LessonChannel.skype;
    }
}
let LessonsService = class LessonsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createByTeacher(teacherUserId, dto) {
        const tProfile = await this.prisma.teacherProfile.findUnique({
            where: { userId: teacherUserId },
            select: { id: true },
        });
        if (!tProfile)
            throw new common_1.ForbiddenException('Профиль преподавателя не найден');
        const startsAt = this.parseStartsAt(dto.startsAt);
        const now = new Date();
        if (startsAt <= now)
            throw new common_1.BadRequestException('Нельзя ставить урок в прошлое');
        const duration = Number(dto.duration);
        if (!Number.isFinite(duration) || !ALLOWED_DURATIONS.has(duration)) {
            throw new common_1.BadRequestException('Недопустимая длительность урока');
        }
        const endsAt = new Date(startsAt.getTime() + duration * 60_000);
        const ts = await this.prisma.teacherSubject.findFirst({
            where: { teacherId: tProfile.id, subjectId: dto.subjectId, duration },
            select: { price: true },
        });
        if (!ts)
            throw new common_1.BadRequestException('Для выбранной длительности нет цены у этого преподавателя');
        if (await this.hasOverlapForTeacher(teacherUserId, startsAt, endsAt)) {
            throw new common_1.BadRequestException('Урок пересекается по времени с другим занятием преподавателя');
        }
        if (await this.hasOverlapForStudent(dto.studentId, startsAt, endsAt)) {
            throw new common_1.BadRequestException('У ученика в это время уже есть занятие');
        }
        const channel = normalizeChannel(dto.channel);
        return this.prisma.lesson.create({
            data: {
                studentId: dto.studentId,
                teacherId: teacherUserId,
                subjectId: dto.subjectId,
                startsAt,
                duration,
                status: client_1.$Enums.LessonStatus.planned,
                channel,
            },
            select: {
                id: true,
                startsAt: true,
                duration: true,
                status: true,
                subjectId: true,
                teacherId: true,
                studentId: true,
                channel: true,
            },
        });
    }
    async listForTeacher(teacherUserId, range = 'upcoming') {
        const now = new Date();
        const whereTime = range === 'upcoming' ? { startsAt: { gte: now } } :
            range === 'past' ? { startsAt: { lt: now } } : {};
        return this.prisma.lesson.findMany({
            where: { teacherId: teacherUserId, ...whereTime },
            orderBy: range === 'past' ? { startsAt: 'desc' } : { startsAt: 'asc' },
            select: {
                id: true,
                startsAt: true,
                duration: true,
                status: true,
                subject: { select: { id: true, name: true } },
                studentId: true,
                channel: true,
            },
        });
    }
    async listForStudent(studentUserId, range = 'upcoming') {
        const now = new Date();
        const whereTime = range === 'upcoming' ? { startsAt: { gte: now } } :
            range === 'past' ? { startsAt: { lt: now } } : {};
        return this.prisma.lesson.findMany({
            where: { studentId: studentUserId, ...whereTime },
            orderBy: range === 'past' ? { startsAt: 'desc' } : { startsAt: 'asc' },
            select: {
                id: true,
                startsAt: true,
                duration: true,
                status: true,
                subject: { select: { id: true, name: true } },
                teacherId: true,
                channel: true,
            },
        });
    }
    async updateStatusByTeacher(teacherUserId, lessonId, dto) {
        const newStatus = dto.status === 'completed' ? client_1.$Enums.LessonStatus.completed :
            dto.status === 'cancelled' ? client_1.$Enums.LessonStatus.cancelled : null;
        if (!newStatus)
            throw new common_1.BadRequestException('Недопустимый статус');
        const lesson = await this.prisma.lesson.findUnique({
            where: { id: lessonId },
            select: { id: true, teacherId: true, status: true, studentId: true },
        });
        if (!lesson)
            throw new common_1.NotFoundException('Урок не найден');
        if (lesson.teacherId !== teacherUserId) {
            throw new common_1.ForbiddenException('Вы не можете менять чужой урок');
        }
        if (lesson.status === newStatus)
            return { ok: true };
        const updated = await this.prisma.lesson.update({
            where: { id: lessonId },
            data: { status: newStatus },
            select: { id: true, status: true, studentId: true },
        });
        return updated;
    }
    parseStartsAt(value) {
        const d = new Date(value);
        if (Number.isNaN(+d))
            throw new common_1.BadRequestException('Некорректная дата/время (startsAt)');
        return d;
    }
    async hasOverlapForTeacher(teacherUserId, start, end) {
        const near = await this.prisma.lesson.findMany({
            where: {
                teacherId: teacherUserId,
                status: { not: client_1.$Enums.LessonStatus.cancelled },
                startsAt: { lt: end },
            },
            select: { startsAt: true, duration: true },
            orderBy: { startsAt: 'asc' },
            take: 100,
        });
        return near.some(l => {
            const lEnd = new Date(l.startsAt.getTime() + l.duration * 60_000);
            return l.startsAt < end && lEnd > start;
        });
    }
    async hasOverlapForStudent(studentUserId, start, end) {
        const near = await this.prisma.lesson.findMany({
            where: {
                studentId: studentUserId,
                status: { not: client_1.$Enums.LessonStatus.cancelled },
                startsAt: { lt: end },
            },
            select: { startsAt: true, duration: true },
            orderBy: { startsAt: 'asc' },
            take: 100,
        });
        return near.some(l => {
            const lEnd = new Date(l.startsAt.getTime() + l.duration * 60_000);
            return l.startsAt < end && lEnd > start;
        });
    }
};
exports.LessonsService = LessonsService;
exports.LessonsService = LessonsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LessonsService);
//# sourceMappingURL=lessons.service.js.map