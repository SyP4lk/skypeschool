import { Body, Controller, Get, Put, Query, UseGuards } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';

type UpsertBody = {
  teacherId: string;
  subjectId: string;
  teacherPrice: number; // копейки
  publicPrice: number;  // копейки
};

@Controller()
export class PricingController {
  constructor(private prisma: PrismaService) {}

  // === ADMIN: апсерт цен ===
  @UseGuards(JwtAuthGuard, RolesGuard)
   @Roles('admin')
  @Put('admin/pricing')
  async upsert(@Body() b: UpsertBody) {
    const teacherId = String(b.teacherId || '').trim();
    const subjectId = String(b.subjectId || '').trim();
    const teacherPrice = Math.max(0, Math.round(Number(b.teacherPrice || 0)));
    const publicPrice  = Math.max(0, Math.round(Number(b.publicPrice  || 0)));
    if (!teacherId || !subjectId) throw new Error('teacherId and subjectId required');
    if (!teacherPrice || !publicPrice) throw new Error('teacherPrice and publicPrice must be > 0');

    const data  = { teacherId, subjectId, teacherPrice, publicPrice };
    const where = { pricing_unique_pair: { teacherId, subjectId } } as const; // ← исправлено

    const item = await (this.prisma as any).pricing.upsert({
      where,
      update: data,
      create: data,
    });
    return { item };
  }

  @Get('pricing/resolve')
  async resolve(
    @Query('teacherId') teacherId: string,
    @Query('subjectId') subjectId: string,
  ) {
    const tId = String(teacherId || '').trim();
    const sId = String(subjectId || '').trim();
    if (!tId || !sId) return { item: null };

    const item = await (this.prisma as any).pricing.findUnique({
      where: { pricing_unique_pair: { teacherId: tId, subjectId: sId } }, // ← исправлено
    });
    return { item };
  }
}
