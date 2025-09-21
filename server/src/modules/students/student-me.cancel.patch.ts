import {
  BadRequestException,
  Controller,
  NotFoundException,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Controller('student')
export class StudentMeCancelController {
  constructor(private readonly prisma: PrismaService) {}

  // POST /api/student/me/lessons/:id/cancel
  @Post('me/lessons/:id/cancel')
  async cancel(@Req() req: any, @Param('id') id: string) {
    const userId = req?.user?.id;
    if (!userId) {
      // если у вас стоит JwtGuard, до сюда не дойдёт неавторизованный пользователь;
      // оставим защиту на случай отсутствия гарда
      throw new BadRequestException('unauthorized');
    }

    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
    } as any);

    if (!lesson || lesson.studentId !== userId) {
      throw new NotFoundException();
    }

    const starts = new Date(lesson.startsAt);
    const diffHrs = (starts.getTime() - Date.now()) / 3_600_000;
    if (diffHrs < 8) {
      throw new BadRequestException({ message: 'too_late_to_cancel' });
    }

    const updated = await this.prisma.lesson.update({
      where: { id },
      data: { status: 'canceled_by_student' },
    } as any);

    return { lesson: updated };
  }
}
