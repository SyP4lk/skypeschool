import { Body, Controller, Get, Post, Put, Delete, Param, UseGuards, Req, BadRequestException, Query, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';

// Локальный тип кандидата для проверки пересечений
type LessonCandidate = {
  startsAt: Date;
  duration: number;
  // опционально: teacherId?: string; studentId?: string;
};

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('lessons')
export class LessonsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async list(@Req() req: any, @Param() _p: any, @Body() _b: any, @Query('studentId') studentId?: string, @Query('teacherId') teacherId?: string) {
    const where: any = {};
    if (studentId) where.studentId = (studentId === 'me' ? req.user.sub : studentId);
    if (teacherId) where.teacherId = (teacherId === 'me' ? req.user.sub : teacherId);
    return this.prisma.lesson.findMany({
      where,
      orderBy: { startsAt: 'desc' },
      include: {
        teacher: { select: { id: true, login: true, firstName: true, lastName: true } },
        student: { select: { id: true, login: true, firstName: true, lastName: true } },
        subject: { select: { id: true, name: true } },
      },
    });
  }

  @Post()
  async create(
    @Req() req: any,
    @Body()
    body: {
      teacherId: string;
      studentId: string;
      subjectId: string;
      startsAt: string;
      duration: number;
      channel: string;
      note?: string;
    },
  ) {
    const user = req.user;
    if (user.role === 'teacher' && user.sub !== body.teacherId) {
      throw new BadRequestException('Teacher can only create lessons for himself');
    }

    const startsAt = new Date(body.startsAt);
    const duration = body.duration;
    const end = new Date(startsAt.getTime() + duration * 60000);

    const candidates = (await this.prisma.lesson.findMany({
      where: {
        OR: [{ teacherId: body.teacherId }, { studentId: body.studentId }],
        startsAt: {
          gte: new Date(startsAt.getTime() - 4 * 3600000),
          lte: new Date(end.getTime() + 4 * 3600000),
        },
      },
      select: { startsAt: true, duration: true }, // берём только нужные поля
    })) as unknown as LessonCandidate[];

    const overlap = candidates.some((l: LessonCandidate) => {
      const lStart = new Date(l.startsAt).getTime();
      const lEnd = lStart + l.duration * 60000;
      return lStart < end.getTime() && lEnd > startsAt.getTime();
    });
    if (overlap) throw new BadRequestException('Time slot overlaps existing lesson');

    return this.prisma.lesson.create({
      data: {
        teacherId: body.teacherId,
        studentId: body.studentId,
        subjectId: body.subjectId,
        startsAt,
        duration,
        status: 'planned',
        channel: body.channel as any, // если есть enum канала — подставь сюда enum
        note: body.note,
      },
    });
  }

  @Put(':id')
  async update(@Req() req: any, @Param('id') id: string, @Body() data: any) {
    const ls = await this.prisma.lesson.findUnique({ where: { id } });
    const user = req.user;
    if (!ls) throw new (await import('@nestjs/common')).BadRequestException('lesson not found');
    if (!(user?.role === 'admin' || (user?.role === 'teacher' && ls.teacherId === user.sub))) {
      throw new (await import('@nestjs/common')).ForbiddenException();
    }
    const allowed: any = {};
    if (typeof data.note === 'string') allowed.note = data.note;
    if (typeof data.status === 'string') allowed.status = data.status;
    return this.prisma.lesson.update({ where: { id }, data: allowed });
  }

  @Delete(':id')
  async remove(@Req() req: any, @Param('id') id: string) {
    const ls = await this.prisma.lesson.findUnique({ where: { id } });
    const user = req.user;
    if (!ls) return { ok: true };
    if (!(user?.role === 'admin' || (user?.role === 'teacher' && ls.teacherId === user.sub))) {
      throw new (await import('@nestjs/common')).ForbiddenException();
    }
    await this.prisma.lesson.delete({ where: { id } });
    return { ok: true };
  }
}
