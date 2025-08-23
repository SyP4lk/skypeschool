import { Controller, Get, UseGuards } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin')
export class AdminOverviewController {
  constructor(private prisma: PrismaService) {}

  @Roles('admin')
  @Get('overview')
  async overview() {
    const [negativeBalances, newStudents] = await this.prisma.$transaction([
      this.prisma.user.count({ where: { balance: { lt: 0 } } }),
      this.prisma.user.findMany({
        where: { role: 'student' },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, login: true, firstName: true, lastName: true },
      }),
    ]);
    return {
      todayLessons: 0,
      next7DaysLessons: 0,
      negativeBalances,
      newStudents,
      balanceChanges: [],
    };
  }
}
