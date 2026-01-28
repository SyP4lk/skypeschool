import { Controller, Get, Patch, Param, Query, Body, UseGuards, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/support')
export class AdminSupportController {
  constructor(private prisma: PrismaService) {}

  @Roles('admin')
  @Get()
  async list(@Query('status') status?: 'new'|'processed') {
    const where: any = status ? { status } : {};
    const items = await this.prisma.supportMessage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return { items };
  }

  @Roles('admin')
  @Patch(':id')
  async setStatus(@Param('id') id: string, @Body() body: { status: 'new'|'processed' }) {
    const { status } = body || {};
    if (status !== 'new' && status !== 'processed') {
      throw new BadRequestException('status must be new|processed');
    }
    const row = await this.prisma.supportMessage.update({
      where: { id },
      data: { status },
    });
    return { id: row.id, status: row.status };
  }
}
