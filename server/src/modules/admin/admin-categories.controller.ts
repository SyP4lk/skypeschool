import { BadRequestException, Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/categories')
export class AdminCategoriesController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @Roles('admin')
  async list() {
    const p: any = this.prisma as any;
    return p.category.findMany({ orderBy: { name: 'asc' } });
  }

  @Post()
  @Roles('admin')
  async create(@Body() body: { name: string }) {
    const name = body?.name?.trim();
    if (!name) throw new BadRequestException('name required');
    const p: any = this.prisma as any;
    return p.category.create({ data: { name } });
  }

  @Put(':id')
  @Roles('admin')
  async update(@Param('id') id: string, @Body() body: { name?: string }) {
    const name = body?.name?.trim();
    const data: any = {};
    if (name) data.name = name;
    const p: any = this.prisma as any;
    return p.category.update({ where: { id }, data });
  }

  @Delete(':id')
  @Roles('admin')
  async remove(@Param('id') id: string) {
    const p: any = this.prisma as any;
    await p.category.delete({ where: { id } });
    return { ok: true };
  }
}
