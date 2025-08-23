import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UseGuards,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin')
export class AdminFinanceController {
  constructor(private prisma: PrismaService) {}

  /**
   * Изменение баланса пользователя на delta (в копейках, может быть отрицательной)
   * Body: { userId: string, delta: number, reason?: string }
   */
  @Roles('admin')
  @Post('balance-change')
  async change(
    @Body()
    body: { userId: string; delta: number; reason?: string },
  ) {
    const userId = body?.userId?.trim();
    if (!userId) throw new BadRequestException('userId required');

    const deltaNum = Number(body.delta);
    if (!Number.isFinite(deltaNum) || !Number.isInteger(deltaNum)) {
      throw new BadRequestException('delta must be integer (kopecks)');
    }
    if (deltaNum === 0) {
      throw new BadRequestException('delta cannot be zero');
    }

    // Просто меняем агрегат (историю/журнал сделаем на этапе ЛК)
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { balance: { increment: deltaNum } },
      select: { id: true, login: true, balance: true },
    });

    return { userId: user.id, balance: user.balance };
  }
}
