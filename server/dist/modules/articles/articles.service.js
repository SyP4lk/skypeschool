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
exports.ArticlesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma.service");
let ArticlesService = class ArticlesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async list(page = 1, limit = 12) {
        const take = Math.min(Math.max(Number(limit) || 12, 1), 50);
        const skip = (Math.max(Number(page) || 1, 1) - 1) * take;
        const [items, total] = await this.prisma.$transaction([
            this.prisma.article.findMany({
                orderBy: { createdAt: 'desc' },
                select: { id: true, slug: true, title: true, image: true, createdAt: true },
                skip, take,
            }),
            this.prisma.article.count(),
        ]);
        return { items, total, page: Math.max(Number(page) || 1, 1), limit: take };
    }
    async bySlug(slug) {
        const a = await this.prisma.article.findUnique({
            where: { slug },
            select: { id: true, slug: true, title: true, content: true, image: true, createdAt: true },
        });
        if (!a)
            throw new common_1.NotFoundException('Article not found');
        return a;
    }
    async findById(id) {
        return this.prisma.article.findUnique({
            where: { id },
            select: { id: true, slug: true, title: true, content: true, image: true, createdAt: true },
        });
    }
    async create(data) {
        const slug = await this.ensureUniqueSlug(this.slugify(data.title));
        return this.prisma.article.create({
            data: { slug, title: data.title, content: data.content, image: data.image },
            select: { id: true, slug: true, title: true, content: true, image: true, createdAt: true },
        });
    }
    async update(id, patch) {
        const existing = await this.prisma.article.findUnique({ where: { id } });
        if (!existing)
            throw new common_1.NotFoundException('Article not found');
        return this.prisma.article.update({
            where: { id },
            data: patch,
            select: { id: true, slug: true, title: true, content: true, image: true, createdAt: true },
        });
    }
    async remove(id) {
        const existing = await this.prisma.article.findUnique({ where: { id } });
        if (!existing)
            return;
        await this.prisma.article.delete({ where: { id } });
    }
    async ensureUniqueSlug(base) {
        let slug = base || 'article';
        let n = 1;
        while (true) {
            const exists = await this.prisma.article.findUnique({ where: { slug } });
            if (!exists)
                return slug;
            n++;
            slug = `${base}-${n}`.slice(0, 80);
        }
    }
    slugify(s) {
        return (s || '')
            .toLowerCase()
            .normalize('NFKD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, 80);
    }
};
exports.ArticlesService = ArticlesService;
exports.ArticlesService = ArticlesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ArticlesService);
//# sourceMappingURL=articles.service.js.map