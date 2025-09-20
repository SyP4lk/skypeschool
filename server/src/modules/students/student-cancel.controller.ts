
import { BadRequestException, Controller, NotFoundException, Param, Post, Req } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Controller('student')
export class StudentCancelController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('me/lessons/:id/cancel')
  async cancel(@Req() req: any, @Param('id') id: string) {
    const userId = req?.user?.id;
    if (!userId) throw new BadRequestException('unauthorized');

    const lesson = await this.prisma.lesson.findUnique({ where: { id } } as any);
    if (!lesson || lesson.studentId !== userId) throw new NotFoundException();

    const diffHrs = (new Date(lesson.startsAt).getTime() - Date.now()) / 3_600_000;
    if (diffHrs < 8) throw new BadRequestException({ message: 'too_late_to_cancel' });

    const updated = await this.prisma.lesson.update({ where: { id }, data: { status: 'canceled_by_student' } } as any);
    return { lesson: updated };
  }
}
