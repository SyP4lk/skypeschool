
import { BadRequestException, Body, Controller, Post, Req } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Controller('teacher')
export class TeacherLessonsController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('me/lessons')
  async createMyLesson(@Req() req: any, @Body() dto: any) {
    const teacherId: string = String(req?.user?.id || '').trim();
    const studentId: string = String(dto?.studentId || '').trim();
    if (!teacherId) throw new BadRequestException('unauthorized');
    if (!studentId) throw new BadRequestException('studentId_required');

    const priceMinor =
      (dto?.priceMinor != null && Number.isFinite(Number(dto.priceMinor)))
        ? Number(dto.priceMinor)
        : (dto?.price != null && Number.isFinite(Number(dto.price)))
          ? Math.round(Number(dto.price) * 100)
          : 0;

    let balance = 0;
    try {
      const s = await this.prisma.user.findUnique({ where: { id: studentId }, select: { balance: true } as any } as any);
      balance = Number(s?.balance || 0);
    } catch {}

    if (priceMinor > 0 && balance < priceMinor) {
      throw new BadRequestException({ message: 'insufficient_funds' });
    }

    const startsAt = dto?.startsAt ? new Date(dto.startsAt) : new Date();
    const lesson = await this.prisma.lesson.create({
      data: {
        teacherId,
        studentId,
        startsAt,
        status: 'scheduled',
        ...(Number.isFinite(priceMinor) ? { priceMinor } : {}),
      },
    } as any);

    return { lesson };
  }
}
