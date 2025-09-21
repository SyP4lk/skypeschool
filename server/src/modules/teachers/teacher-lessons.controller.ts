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

    const priceCandidate = Number((dto && (dto.priceMinor ?? dto.price)) ?? NaN);
    const priceMinor = Number.isFinite(priceCandidate) ? priceCandidate : undefined;

    // Balance check — additive and optional
    try {
      const student = await (this.prisma as any).user.findUnique({
        where: { id: studentId },
        select: { balance: true },
      } as any);
      const balanceMinor = Number(student?.balance);
      if (Number.isFinite(balanceMinor) && Number.isFinite(priceCandidate)) {
        if (balanceMinor < priceCandidate) {
          throw new BadRequestException({ message: 'insufficient_funds' });
        }
      }
    } catch (e) {
      if (String((e as any)?.message || '').includes('insufficient_funds')) throw e;
      // else silently ignore schema differences
    }

    const startsAt = dto?.startsAt ? new Date(dto.startsAt) : new Date();
    const data: any = { teacherId, studentId, startsAt, status: 'scheduled' };
    if (Number.isFinite(priceMinor)) data.priceMinor = priceMinor;
    if (dto?.durationMin != null) data.duration = Number(dto.durationMin);

    const lesson = await (this.prisma as any).lesson.create({ data } as any);
    return { lesson };
  }
}
