import { BadRequestException, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';

const EIGHT_HOURS_MS = 8 * 60 * 60 * 1000;

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('student')
export class StudentCancelController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * POST /api/student/me/lessons/:id/cancel
   * Требование: если до начала < 8 часов -> 400 { message: 'too_late_to_cancel' }
   * Иначе помечаем урок отменённым (без изменения схемы).
   */
  @Post('me/lessons/:id/cancel')
  @Roles('student')
  async cancelMyLesson(@Req() req: any, @Param('id') id: string) {
    const studentId = String(req?.user?.sub || '').trim();
    if (!studentId) throw new BadRequestException('unauthorized');

    const lesson = await (this.prisma as any).lesson.findUnique({ where: { id } });
    if (!lesson) throw new BadRequestException('lesson not found');
    if (String(lesson.studentId) !== studentId) throw new BadRequestException('forbidden');
    const status = String(lesson.status || '').toLowerCase();
    if (status === 'completed') throw new BadRequestException('already done');

    const startsAt = new Date(lesson.startsAt).getTime();
    const now = Date.now();
    if (!Number.isFinite(startsAt)) throw new BadRequestException('startsAt invalid');

    if (startsAt - now < EIGHT_HOURS_MS) {
      // Ровно тот контракт, что ждёт фронт
      throw new BadRequestException({ message: 'too_late_to_cancel' });
    }

    // Безопасно ставим "cancelled" (enum из текущей схемы). Никаких миграций.
    const updated = await (this.prisma as any).lesson.update({
      where: { id },
      data: { status: 'cancelled' },
    });

    return { ok: true, lesson: updated };
  }
}
