import { Controller, Get, UseGuards } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin')
export class AdminController {
  constructor(private prisma: PrismaService) {}

  @Roles('admin')
  @Get('overview')
  async overview() {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const in7days = new Date(now.getTime() + 7 * 24 * 3600 * 1000);

    const [todayLessons, next7Lessons, negativeBalances, recentStudents, recentChanges] = await Promise.all([
      this.prisma.lesson.count({ where: { startsAt: { gte: startOfToday, lte: endOfToday } } }),
      this.prisma.lesson.count({ where: { startsAt: { gt: now, lte: in7days } } }),
      this.prisma.user.count({ where: { balance: { lt: 0 } } }),
      this.prisma.user.findMany({
        where: { role: 'student' },
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: { id: true, login: true, firstName: true, lastName: true, createdAt: true },
      }),
      this.prisma.balanceChange.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          delta: true,
          reason: true,
          createdAt: true,
          user: { select: { id: true, login: true, firstName: true, lastName: true } },
        },
      }),
    ]);

    return {
      metrics: {
        todayLessons,
        next7Lessons,
        negativeBalances,
      },
      recentStudents,
      recentChanges,
    };
  }
}
