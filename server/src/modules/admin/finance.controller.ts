import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/finance')
export class AdminFinanceController {
  constructor(private prisma: PrismaService) {}

  @Roles('admin')
  @Post('adjust')
  async adjust(@Body() body: { userId: string; delta: number; reason?: string; adminId?: string }) {
    const user = await this.prisma.user.update({ where: { id: body.userId }, data: { balance: { increment: body.delta } } });
    await this.prisma.balanceChange.create({ data: { userId: body.userId, delta: body.delta, reason: body.reason, adminId: body.adminId || null } });
    return { ok: true, balance: user.balance };
  }
}
