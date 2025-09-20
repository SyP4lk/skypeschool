import { BadRequestException, Body, Controller, Post, Req } from '@nestjs/common';
import { PrismaService } from '../../prisma.service'; // <-- фикс пути
import { isP2021, isP2022 } from '../../common/prisma.util';

@Controller('teacher/me/lessons')
export class TeacherLessonsController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  async create(@Req() req: any, @Body() dto: any) {
    // --- Проверка баланса до создания урока ---
    const priceMinor: number | null =
      Number.isFinite(Number(dto?.price)) ? Math.trunc(Number(dto.price)) : null;

    let student: any = null;
    try {
      student = await this.prisma.user.findUnique({
        where: { id: dto.studentId },
        select: { id: true, balance: true } as any,
      } as any);
    } catch (e) {
      if (isP2022(e) || isP2021(e)) {
        try {
          const sp = await this.prisma.studentProfile.findUnique({
            where: { userId: dto.studentId },
            select: { userId: true, balance: true } as any,
          } as any);
          if (sp) student = { id: sp.userId, balance: sp.balance };
        } catch {}
      } else {
        throw e;
      }
    }

    if (priceMinor != null) {
      const balance = typeof student?.balance === 'number' ? student.balance : 0;
      if (balance < priceMinor) {
        throw new BadRequestException({ message: 'insufficient_funds' });
      }
    }
    // --- /проверка баланса ---

    // TODO: здесь остаются ваши проверки пересечений по времени и пр.

    // Безопасное создание: сначала пробуем с price, если колонки нет — без неё
    try {
      return await this.prisma.lesson.create({
        data: {
          teacherId: req?.user?.id,
          studentId: dto.studentId,
          ...(priceMinor != null ? { price: priceMinor as any } : {}),
          startsAt: dto.startsAt,
          endsAt: dto.endsAt,
          status: 'planned',
        } as any,
      });
    } catch (e) {
      if (isP2021(e) || isP2022(e)) {
        // Повтор без поля price (если колонки нет)
        return await this.prisma.lesson.create({
          data: {
            teacherId: req?.user?.id,
            studentId: dto.studentId,
            startsAt: dto.startsAt,
            endsAt: dto.endsAt,
            status: 'planned',
          } as any,
        });
      }
      throw e;
    }
  }
}
