import {
  Controller, Get, Post, Put, Delete, Body, Param, Query,
  UseGuards, BadRequestException
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';

function translit(s: string): string {
  const map: Record<string,string> = {'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'e','ж':'zh','з':'z','и':'i','й':'j','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'h','ц':'c','ч':'ch','ш':'sh','щ':'shh','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya','А':'a','Б':'b','В':'v','Г':'g','Д':'d','Е':'e','Ё':'e','Ж':'zh','З':'z','И':'i','Й':'j','К':'k','Л':'l','М':'m','Н':'n','О':'o','П':'p','Р':'r','С':'s','Т':'t','У':'u','Ф':'f','Х':'h','Ц':'c','Ч':'ch','Ш':'sh','Щ':'shh','Ъ':'','Ы':'y','Ь':'','Э':'e','Ю':'yu','Я':'ya'};
  return s.split('').map(ch => map[ch] ?? ch).join('');
}
function slugify(name: string): string {
  const base = translit(name).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').replace(/--+/g,'-');
  return base || 'subject';
}

@Controller('subjects')
export class SubjectsController {
  constructor(private prisma: PrismaService) {}

  /**
   * Публичный список предметов.
   * Поддерживает ?query= (или ?q=) для фильтрации по имени.
   */
  @Get()
  async all(@Query('query') query?: string, @Query('q') q?: string) {
    const term = (query ?? q ?? '').trim();
    const where = term
      ? { name: { contains: term, mode: 'insensitive' as const } }
      : undefined;
        const subjects = await this.prisma.subject.findMany({
      where,
      orderBy: { name: 'asc' },
      include: { category: true },
      take: term ? 50 : undefined, // ограничим при поиске
    });

    if (subjects.length === 0) return subjects;

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
    }))
  }

  /**
   * Публичный компактный поиск: /subjects/search?query=
   * Возвращает максимум 10 результатов.
   */
  @Get('search')
  async search(@Query('query') query?: string, @Query('q') q2?: string) {
    const term = (query ?? q2 ?? '').trim();
    if (!term) return [];
    return this.prisma.subject.findMany({
      where: { name: { contains: term, mode: 'insensitive' } },
      orderBy: { name: 'asc' },
      include: { category: true },
      take: 10,
    });
  }

  // ---- Ниже только для админа ----

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post()
  async create(@Body() body: { name: string; categoryId: string; slug?: string }) {
    if (!body.name?.trim()) throw new BadRequestException('name is required');
    let slug = (body.slug || '').trim();
    if (!slug) slug = slugify(body.name);
    let unique = slug, i = 2;
    while (await this.prisma.subject.findUnique({ where: { slug: unique } })) unique = `${slug}-${i++}`;
    return this.prisma.subject.create({
      data: { name: body.name, slug: unique, categoryId: body.categoryId }
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() data: { name?: string; categoryId?: string; descriptionShort?: string },
  ) {
    return this.prisma.subject.update({
      where: { id },
      data: {
        name: data.name,
        categoryId: data.categoryId,
        descriptionShort: data.descriptionShort,
      },
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.prisma.subject.delete({ where: { id } });
    return { ok: true };
  }
}
