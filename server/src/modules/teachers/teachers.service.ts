import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import * as argon2 from 'argon2';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';

/**
 * Сервис для работы с преподавателями.
 * Содержит методы для публичного вывода, а также административные операции.
 */
@Injectable()
export class TeachersService {
  constructor(private readonly prisma: PrismaService) {}


  /**
   * Список активных преподавателей для публичной части, с фильтрацией по предмету или категории.
   */
  async findAllSummary(opts?: { subjectId?: string; categoryId?: string }) {
    const where: any = { isActive: true };
    if (opts?.subjectId) {
      where.teacherSubjects = { some: { subjectId: opts.subjectId } };
    } else if (opts?.categoryId) {
      where.teacherSubjects = { some: { subject: { categoryId: opts.categoryId } } };
    }
    const list = await this.prisma.teacherProfile.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }],
      select: {
        id: true,
        userId: true,
        aboutShort: true,
        photo: true,
        teacherSubjects: {
          select: {
            subject: { select: { id: true, name: true, slug: true } },
            price: true,
          },
        },
      },
    });
    return list.map((t) => ({
      id: t.id,
      userId: t.userId,
      aboutShort: t.aboutShort,
      photo: t.photo ?? null,
      subjects: t.teacherSubjects.map((ts) => ts.subject),
      priceRange: t.teacherSubjects.length
        ? {
            min: Math.min(...t.teacherSubjects.map((x) => x.price)),
            max: Math.max(...t.teacherSubjects.map((x) => x.price)),
          }
        : null,
    }));
  }

  /**
   * Подробная информация о преподавателе, включая предметы и данные пользователя.
   */
  async findOneDetail(id: string) {
    return this.prisma.teacherProfile.findUnique({
      where: { id },
      include: {
        teacherSubjects: { include: { subject: true } },
        user: { select: { login: true, firstName: true, lastName: true } },
      },
    });
  }

  /**
   * Список преподавателей для админки. Включает их учётные записи.
   */
  async findAllForAdmin() {
    return this.prisma.teacherProfile.findMany({
      include: {
        user: { select: { id: true, login: true, firstName: true, lastName: true } },
      },
    });
  }

  /**
   * Создать нового преподавателя и связать его с учётной записью.
   */
  async createTeacher(dto: CreateTeacherDto) {
    return await this.prisma.$transaction(async (tx) => {
      // создаём пользователя
      const hashed = await argon2.hash(dto.password);
      const user = await tx.user.create({
        data: {
          login: dto.login,
          passwordHash: hashed,
          role: 'teacher',
          firstName: dto.firstName,
          lastName: dto.lastName,
        },
      });
      // создаём профиль
      const profile = await tx.teacherProfile.create({
        data: {
          userId: user.id,
          aboutShort: dto.aboutShort ?? null,
          photo: dto.photo ?? null,
          isActive: true,
        },
      });
      // создаём предметы. Модель TeacherSubject требует обязательный параметр
      // `duration`, поэтому добавляем его из константы. Если список
      // teacherSubjects пуст — ничего не создаём.
      if (dto.teacherSubjects && dto.teacherSubjects.length > 0) {
        await tx.teacherSubject.createMany({
          data: dto.teacherSubjects.map((ts) => ({
            teacherId: profile.id,
            subjectId: ts.subjectId,
            price: ts.price,
            duration: ts.duration,
          })),
        });
      }
      return { id: profile.id };
    });
  }

  /**
   * Обновить «человеческие» данные преподавателя. ID и userId не меняются.
   */
  async updateTeacher(id: string, dto: UpdateTeacherDto) {
    // обновляем профиль
    await this.prisma.teacherProfile.update({
      where: { id },
      data: {
        aboutShort: dto.aboutShort ?? undefined,
        photo: dto.photo ?? undefined,
      },
    });
    // обновляем имя/фамилию в учётной записи
    if (dto.firstName || dto.lastName) {
      const profile = await this.prisma.teacherProfile.findUnique({ where: { id }, select: { userId: true } });
      if (profile) {
        await this.prisma.user.update({
          where: { id: profile.userId },
          data: {
            firstName: dto.firstName ?? undefined,
            lastName: dto.lastName ?? undefined,
          },
        });
      }
    }
    // обновляем список предметов: удаляем старые, добавляем новые. При создании
    // новых связей указываем обязательную длительность занятия.
    if (dto.teacherSubjects) {
      await this.prisma.teacherSubject.deleteMany({ where: { teacherId: id } });
      if (dto.teacherSubjects.length > 0) {
        await this.prisma.teacherSubject.createMany({
          data: dto.teacherSubjects.map((ts) => ({
            teacherId: id,
            subjectId: ts.subjectId,
            price: ts.price,
            duration: ts.duration,
          })),
        });
      }
    }
    return { ok: true };
  }

  /**
   * Пометить преподавателя неактивным (soft delete). При необходимости можно добавить полное удаление.
   */
  async removeTeacher(id: string) {
    await this.prisma.teacherProfile.update({
      where: { id },
      data: { isActive: false },
    });
    return { ok: true };
  }
}