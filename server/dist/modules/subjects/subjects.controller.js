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
exports.SubjectsController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma.service");
const jwt_guard_1 = require("../auth/jwt.guard");
const roles_decorator_1 = require("../common/roles.decorator");
const roles_guard_1 = require("../common/roles.guard");
function translit(s) {
    const map = { 'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e', 'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'j', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'c', 'ч': 'ch', 'ш': 'sh', 'щ': 'shh', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya', 'А': 'a', 'Б': 'b', 'В': 'v', 'Г': 'g', 'Д': 'd', 'Е': 'e', 'Ё': 'e', 'Ж': 'zh', 'З': 'z', 'И': 'i', 'Й': 'j', 'К': 'k', 'Л': 'l', 'М': 'm', 'Н': 'n', 'О': 'o', 'П': 'p', 'Р': 'r', 'С': 's', 'Т': 't', 'У': 'u', 'Ф': 'f', 'Х': 'h', 'Ц': 'c', 'Ч': 'ch', 'Ш': 'sh', 'Щ': 'shh', 'Ъ': '', 'Ы': 'y', 'Ь': '', 'Э': 'e', 'Ю': 'yu', 'Я': 'ya' };
    return s.split('').map(ch => map[ch] ?? ch).join('');
}
function slugify(name) {
    const base = translit(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').replace(/--+/g, '-');
    return base || 'subject';
}
let SubjectsController = class SubjectsController {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async all(query, q) {
        const term = (query ?? q ?? '').trim();
        const where = term
            ? { name: { contains: term, mode: 'insensitive' } }
            : undefined;
        const subjects = await this.prisma.subject.findMany({
            where,
            orderBy: { name: 'asc' },
            include: { category: true },
            take: term ? 50 : undefined,
        });
        if (subjects.length === 0)
            return subjects;
        const mins = await this.prisma.teacherSubject.groupBy({
            by: ['subjectId'],
            where: { subjectId: { in: subjects.map(s => s.id) } },
            _min: { price: true, duration: true },
        });
        const map = new Map(mins.map(m => [m.subjectId, m._min]));
        return subjects.map(s => ({
            ...s,
            minPrice: map.get(s.id)?.price ?? null,
            minDuration: map.get(s.id)?.duration ?? null,
        }));
    }
    async search(query, q2) {
        const term = (query ?? q2 ?? '').trim();
        if (!term)
            return [];
        return this.prisma.subject.findMany({
            where: { name: { contains: term, mode: 'insensitive' } },
            orderBy: { name: 'asc' },
            include: { category: true },
            take: 10,
        });
    }
    async create(body) {
        if (!body.name?.trim())
            throw new common_1.BadRequestException('name is required');
        let slug = (body.slug || '').trim();
        if (!slug)
            slug = slugify(body.name);
        let unique = slug, i = 2;
        while (await this.prisma.subject.findUnique({ where: { slug: unique } }))
            unique = `${slug}-${i++}`;
        return this.prisma.subject.create({
            data: { name: body.name, slug: unique, categoryId: body.categoryId }
        });
    }
    async update(id, data) {
        return this.prisma.subject.update({
            where: { id },
            data: {
                name: data.name,
                categoryId: data.categoryId,
                descriptionShort: data.descriptionShort,
            },
        });
    }
    async remove(id) {
        await this.prisma.subject.delete({ where: { id } });
        return { ok: true };
    }
};
exports.SubjectsController = SubjectsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('query')),
    __param(1, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SubjectsController.prototype, "all", null);
__decorate([
    (0, common_1.Get)('search'),
    __param(0, (0, common_1.Query)('query')),
    __param(1, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SubjectsController.prototype, "search", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SubjectsController.prototype, "create", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SubjectsController.prototype, "update", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SubjectsController.prototype, "remove", null);
exports.SubjectsController = SubjectsController = __decorate([
    (0, common_1.Controller)('subjects'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SubjectsController);
//# sourceMappingURL=subjects.controller.js.map