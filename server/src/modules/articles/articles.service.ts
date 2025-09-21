import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class ArticlesService {
  constructor(private readonly prisma: PrismaService) {}

  // Публичный список статей (пагинация простая)
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

  async bySlug(slug: string) {
    const a = await this.prisma.article.findUnique({
      where: { slug },
      select: { id: true, slug: true, title: true, content: true, image: true, createdAt: true },
    });
    if (!a) throw new NotFoundException('Article not found');
    return a;
  }

  async findById(id: string) {
    return this.prisma.article.findUnique({
      where: { id },
      select: { id: true, slug: true, title: true, content: true, image: true, createdAt: true },
    });
  }

  async create(data: { title: string; content: string; image: string | null }) {
    const slug = await this.ensureUniqueSlug(this.slugify(data.title));
    return this.prisma.article.create({
      data: { slug, title: data.title, content: data.content, image: data.image },
      select: { id: true, slug: true, title: true, content: true, image: true, createdAt: true },
    });
  }

  async update(id: string, patch: Partial<{ title: string; content: string; image: string | null }>) {
    const existing = await this.prisma.article.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Article not found');
    // slug не меняем, чтобы не ломать публичные ссылки
    return this.prisma.article.update({
      where: { id },
      data: patch,
      select: { id: true, slug: true, title: true, content: true, image: true, createdAt: true },
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.article.findUnique({ where: { id } });
    if (!existing) return;
    await this.prisma.article.delete({ where: { id } });
  }

  private async ensureUniqueSlug(base: string) {
    let slug = base || 'article';
    let n = 1;
    while (true) {
      const exists = await this.prisma.article.findUnique({ where: { slug } });
      if (!exists) return slug;
      n++;
      slug = `${base}-${n}`.slice(0, 80);
    }
  }

  private slugify(s: string) {
    return (s || '')
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80);
  }
}
