import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { $Enums } from '@prisma/client';

type Range = 'upcoming' | 'past' | 'all';

type CreateLessonDto = {
  studentId: string;
  subjectId: string;
  startsAt: string;       // ISO
  duration: number;       // 45 | 60 | 90
  channel?: 'skype' | 'zoom' | 'whatsapp' | 'telegram' | 'other';
};

type UpdateStatusDto = { status: 'completed' | 'cancelled' };

const ALLOWED_DURATIONS = new Set([45, 60, 90]);

function normalizeChannel(ch?: string): $Enums.LessonChannel {
  switch ((ch || 'skype').toLowerCase()) {
    case 'zoom': return $Enums.LessonChannel.zoom;
    case 'whatsapp': return $Enums.LessonChannel.whatsapp;
    case 'telegram': return $Enums.LessonChannel.telegram;
    case 'other': return $Enums.LessonChannel.other;
    case 'skype':
    default: return $Enums.LessonChannel.skype;
  }
}

@Injectable()
export class LessonsService {
  constructor(private readonly prisma: PrismaService) {}

  async createByTeacher(teacherUserId: string, dto: CreateLessonDto) {
    const tProfile = await this.prisma.teacherProfile.findUnique({
      where: { userId: teacherUserId },
      select: { id: true },
    });
    if (!tProfile) throw new ForbiddenException('Профиль преподавателя не найден');

    const startsAt = this.parseStartsAt(dto.startsAt);
    const now = new Date();
    if (startsAt <= now) throw new BadRequestException('Нельзя ставить урок в прошлое');

    const duration = Number(dto.duration);
    if (!Number.isFinite(duration) || !ALLOWED_DURATIONS.has(duration)) {
      throw new BadRequestException('Недопустимая длительность урока');
    }
    const endsAt = new Date(startsAt.getTime() + duration * 60_000);

    const ts = await this.prisma.teacherSubject.findFirst({
      where: { teacherId: tProfile.id, subjectId: dto.subjectId, duration },
      select: { price: true },
    });
    if (!ts) throw new BadRequestException('Для выбранной длительности нет цены у этого преподавателя');

    if (await this.hasOverlapForTeacher(teacherUserId, startsAt, endsAt)) {
      throw new BadRequestException('Урок пересекается по времени с другим занятием преподавателя');
    }
    if (await this.hasOverlapForStudent(dto.studentId, startsAt, endsAt)) {
      throw new BadRequestException('У ученика в это время уже есть занятие');
    }

    const channel = normalizeChannel(dto.channel);

    return this.prisma.lesson.create({
      data: {
        studentId: dto.studentId,
        teacherId: teacherUserId,
        subjectId: dto.subjectId,
        startsAt,
        duration,
        status: $Enums.LessonStatus.planned,
        channel,
      },
      select: {
        id: true,
        startsAt: true,
        duration: true,
        status: true,
        subjectId: true,
        teacherId: true,
        studentId: true,
        channel: true,
      },
    });
  }

  async listForTeacher(teacherUserId: string, range: Range = 'upcoming') {
    const now = new Date();
    const whereTime =
      range === 'upcoming' ? { startsAt: { gte: now } } :
      range === 'past'     ? { startsAt: { lt: now } } : {};

    return this.prisma.lesson.findMany({
      where: { teacherId: teacherUserId, ...whereTime },
      orderBy: range === 'past' ? { startsAt: 'desc' } : { startsAt: 'asc' },
      select: {
        id: true,
        startsAt: true,
        duration: true,
        status: true,
        subject: { select: { id: true, name: true } },
        studentId: true,
        channel: true,
      },
    });
  }

  async listForStudent(studentUserId: string, range: Range = 'upcoming') {
    const now = new Date();
    const whereTime =
      range === 'upcoming' ? { startsAt: { gte: now } } :
      range === 'past'     ? { startsAt: { lt: now } } : {};

    return this.prisma.lesson.findMany({
      where: { studentId: studentUserId, ...whereTime },
      orderBy: range === 'past' ? { startsAt: 'desc' } : { startsAt: 'asc' },
      select: {
        id: true,
        startsAt: true,
        duration: true,
        status: true,
        subject: { select: { id: true, name: true } },
        teacherId: true,
        channel: true,
      },
    });
  }

  async updateStatusByTeacher(
    teacherUserId: string,
    lessonId: string,
    dto: UpdateStatusDto,
  ) {
    const newStatus =
      dto.status === 'completed' ? $Enums.LessonStatus.completed :
      dto.status === 'cancelled' ? $Enums.LessonStatus.cancelled : null;
    if (!newStatus) throw new BadRequestException('Недопустимый статус');

    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { id: true, teacherId: true, status: true, studentId: true },
    });
    if (!lesson) throw new NotFoundException('Урок не найден');
    if (lesson.teacherId !== teacherUserId) {
      throw new ForbiddenException('Вы не можете менять чужой урок');
    }
    if (lesson.status === newStatus) return { ok: true };

    const updated = await this.prisma.lesson.update({
      where: { id: lessonId },
      data: { status: newStatus },
      select: { id: true, status: true, studentId: true },
    });

    return updated;
  }

  private parseStartsAt(value: string): Date {
    const d = new Date(value);
    if (Number.isNaN(+d)) throw new BadRequestException('Некорректная дата/время (startsAt)');
    return d;
  }

  private async hasOverlapForTeacher(teacherUserId: string, start: Date, end: Date): Promise<boolean> {
    const near = await this.prisma.lesson.findMany({
      where: {
        teacherId: teacherUserId,
        status: { not: $Enums.LessonStatus.cancelled },
        startsAt: { lt: end },
      },
      select: { startsAt: true, duration: true },
      orderBy: { startsAt: 'asc' },
      take: 100,
    });
    return near.some(l => {
      const lEnd = new Date(l.startsAt.getTime() + l.duration * 60_000);
      return l.startsAt < end && lEnd > start;
    });
  }

  private async hasOverlapForStudent(studentUserId: string, start: Date, end: Date): Promise<boolean> {
    const near = await this.prisma.lesson.findMany({
      where: {
        studentId: studentUserId,
        status: { not: $Enums.LessonStatus.cancelled },
        startsAt: { lt: end },
      },
      select: { startsAt: true, duration: true },
      orderBy: { startsAt: 'asc' },
      take: 100,
    });
    return near.some(l => {
      const lEnd = new Date(l.startsAt.getTime() + l.duration * 60_000);
      return l.startsAt < end && lEnd > start;
    });
  }
}
