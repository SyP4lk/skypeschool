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
exports.LessonsController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma.service");
const jwt_guard_1 = require("../auth/jwt.guard");
const roles_guard_1 = require("../common/roles.guard");
let LessonsController = class LessonsController {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async list(req, _p, _b, studentId, teacherId) {
        const where = {};
        if (studentId)
            where.studentId = (studentId === 'me' ? req.user.sub : studentId);
        if (teacherId)
            where.teacherId = (teacherId === 'me' ? req.user.sub : teacherId);
        return this.prisma.lesson.findMany({
            where,
            orderBy: { startsAt: 'desc' },
            include: {
                teacher: { select: { id: true, login: true, firstName: true, lastName: true } },
                student: { select: { id: true, login: true, firstName: true, lastName: true } },
                subject: { select: { id: true, name: true } },
            },
        });
    }
    async create(req, body) {
        const user = req.user;
        if (user.role === 'teacher' && user.sub !== body.teacherId) {
            throw new common_1.BadRequestException('Teacher can only create lessons for himself');
        }
        const startsAt = new Date(body.startsAt);
        const duration = body.duration;
        const end = new Date(startsAt.getTime() + duration * 60000);
        const candidates = (await this.prisma.lesson.findMany({
            where: {
                OR: [{ teacherId: body.teacherId }, { studentId: body.studentId }],
                startsAt: {
                    gte: new Date(startsAt.getTime() - 4 * 3600000),
                    lte: new Date(end.getTime() + 4 * 3600000),
                },
            },
            select: { startsAt: true, duration: true },
        }));
        const overlap = candidates.some((l) => {
            const lStart = new Date(l.startsAt).getTime();
            const lEnd = lStart + l.duration * 60000;
            return lStart < end.getTime() && lEnd > startsAt.getTime();
        });
        if (overlap)
            throw new common_1.BadRequestException('Time slot overlaps existing lesson');
        return this.prisma.lesson.create({
            data: {
                teacherId: body.teacherId,
                studentId: body.studentId,
                subjectId: body.subjectId,
                startsAt,
                duration,
                status: 'planned',
                channel: body.channel,
                note: body.note,
            },
        });
    }
    async update(req, id, data) {
        const ls = await this.prisma.lesson.findUnique({ where: { id } });
        const user = req.user;
        if (!ls)
            throw new (await Promise.resolve().then(() => require('@nestjs/common'))).BadRequestException('lesson not found');
        if (!(user?.role === 'admin' || (user?.role === 'teacher' && ls.teacherId === user.sub))) {
            throw new (await Promise.resolve().then(() => require('@nestjs/common'))).ForbiddenException();
        }
        const allowed = {};
        if (typeof data.note === 'string')
            allowed.note = data.note;
        if (typeof data.status === 'string')
            allowed.status = data.status;
        return this.prisma.lesson.update({ where: { id }, data: allowed });
    }
    async remove(req, id) {
        const ls = await this.prisma.lesson.findUnique({ where: { id } });
        const user = req.user;
        if (!ls)
            return { ok: true };
        if (!(user?.role === 'admin' || (user?.role === 'teacher' && ls.teacherId === user.sub))) {
            throw new (await Promise.resolve().then(() => require('@nestjs/common'))).ForbiddenException();
        }
        await this.prisma.lesson.delete({ where: { id } });
        return { ok: true };
    }
};
exports.LessonsController = LessonsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)()),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Query)('studentId')),
    __param(4, (0, common_1.Query)('teacherId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object, String, String]),
    __metadata("design:returntype", Promise)
], LessonsController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], LessonsController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], LessonsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], LessonsController.prototype, "remove", null);
exports.LessonsController = LessonsController = __decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('lessons'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LessonsController);
//# sourceMappingURL=lessons.controller.js.map