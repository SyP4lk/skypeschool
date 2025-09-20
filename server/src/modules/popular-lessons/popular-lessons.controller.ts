
import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Controller()
export class PopularLessonsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('public/popular-lessons')
  async listPublic(@Query('limit') limit = '6') {
    const items = await this.prisma.popularLesson.findMany({
      where: { isActive: true },
      orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }],
      take: Math.max(1, Math.min(Number(limit) || 6, 24)),
      include: { subject: true } as any,
    } as any);
    return { items };
  }

  @Get('admin/popular-lessons')
  async listAdmin() {
    const items = await this.prisma.popularLesson.findMany({
      orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }],
      include: { subject: true } as any,
    } as any);
    return { items };
  }

  @Post('admin/popular-lessons')
  async create(@Body() dto: any) {
    const data: any = {
      imageUrl: String(dto.imageUrl || ''),
      subjectId: String(dto.subjectId || ''),
      isActive: dto.isActive !== false,
      sort: Number.isFinite(Number(dto.sort)) ? Number(dto.sort) : 0,
    };
    if (!data.imageUrl || !data.subjectId) throw new Error('imageUrl_and_subjectId_required');
    const item = await this.prisma.popularLesson.create({ data } as any);
    return { item };
  }

  @Put('admin/popular-lessons/:id')
  async update(@Param('id') id: string, @Body() dto: any) {
    const data: any = {};
    if (dto.imageUrl != null) data.imageUrl = String(dto.imageUrl);
    if (dto.subjectId != null) data.subjectId = String(dto.subjectId);
    if (dto.isActive != null) data.isActive = !!dto.isActive;
    if (dto.sort != null && Number.isFinite(Number(dto.sort))) data.sort = Number(dto.sort);
    const item = await this.prisma.popularLesson.update({ where: { id }, data } as any);
    return { item };
  }

  @Delete('admin/popular-lessons/:id')
  async remove(@Param('id') id: string) {
    await this.prisma.popularLesson.delete({ where: { id } } as any);
    return { ok: true };
  }
}
