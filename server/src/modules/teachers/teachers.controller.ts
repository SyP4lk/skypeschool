import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as argon2 from 'argon2';
import { promises as fs } from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';

import { PrismaService } from '../../prisma.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';

type SubjectInput = { subjectId: string; duration: number; price: number };

// Контроллер в админ-зоне. Если контроллер подключён в AdminModule с префиксом /admin,
// то конечные маршруты будут /api/admin/teachers/*
@Controller('teachers')
export class TeachersController {
  constructor(private prisma: PrismaService) {}

  // ===== Helpers =====
  private async saveUpload(file?: Express.Multer.File): Promise<string | null> {
    if (!file) return null;
    const uploadDir = path.join(process.cwd(), 'uploads');
    await fs.mkdir(uploadDir, { recursive: true });
    const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg';
    const fileName = `${randomUUID()}${ext}`;
    await fs.writeFile(path.join(uploadDir, fileName), file.buffer);
    return `/uploads/${fileName}`;
  }

  private parseSubjects(raw: any): SubjectInput[] {
    try {
      const arr = JSON.parse(raw ?? '[]');
      if (!Array.isArray(arr)) return [];
      return arr
        .map((s) => ({
          subjectId: String(s.subjectId),
          duration: Number(s.duration),
          price: Number(s.price), // РУБЛИ (без *100)
        }))
        .filter((s) => s.subjectId && s.duration > 0 && s.price > 0);
    } catch {
      return [];
    }
  }

  // ===== READ =====

  // список преподавателей (с предметами)
  @Get()
  async list() {
    return this.prisma.teacherProfile.findMany({
      include: {
        user: {
          select: {
            id: true,
            login: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
            balance: true,
          },
        },
        teacherSubjects: { include: { subject: true } },
      },
    });
  }

  // один преподаватель
  @Get(':id')
  async one(@Param('id') id: string) {
    return this.prisma.teacherProfile.findUnique({
      where: { id },
      include: {
        user: true,
        teacherSubjects: { include: { subject: true } },
      },
    });
  }

  // ===== CREATE =====

  // Вариант 1: передан userId — создаём профиль учителя для уже существующего пользователя
  // Вариант 2: переданы login/password — создаём пользователя-учителя и профиль
  // multipart/form-data: photo, aboutShort, contact*, teacherSubjects(JSON)
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @UseInterceptors(FileInterceptor('photo'))
  async create(@UploadedFile() file: Express.Multer.File, @Body() body: any) {
    const hasUserId = !!body.userId;
    const hasCreds = !!body.login && !!body.password;

    if (!hasUserId && !hasCreds) {
      throw new BadRequestException('Provide userId OR login+password');
    }

    const subjects = this.parseSubjects(body.teacherSubjects);
    const photoPath = await this.saveUpload(file);

    return this.prisma.$transaction(async (tx) => {
      let userId = body.userId as string | undefined;

      if (!userId) {
        const passwordHash = await argon2.hash(String(body.password));
        const user = await tx.user.create({
          data: {
            login: String(body.login),
            passwordHash,
            role: 'teacher',
            firstName: body.firstName ?? null,
            lastName: body.lastName ?? null,
            phone: body.phone ?? null,
            email: body.email ?? null,
          },
        });
        userId = user.id;
      } else {
        // на всякий обновим ФИО/телефон/почту, если прислали
        await tx.user.update({
          where: { id: userId },
          data: {
            firstName: body.firstName ?? undefined,
            lastName: body.lastName ?? undefined,
            phone: body.phone ?? undefined,
            email: body.email ?? undefined,
          },
        });
      }

      const profile = await tx.teacherProfile.create({
        data: {
          userId: userId!,
          aboutShort: body.aboutShort ?? null,
          photo: photoPath,
          // контакты преподавателя
          contactVk: body.contactVk ?? null,
          contactTelegram: body.contactTelegram ?? null,
          contactWhatsapp: body.contactWhatsapp ?? null,
          contactZoom: body.contactZoom ?? null,
          contactTeams: body.contactTeams ?? null,
          contactDiscord: body.contactDiscord ?? null,
          contactMax: body.contactMax ?? null,
        },
      });

      // предметы
      for (const s of subjects) {
        await tx.teacherSubject.create({
          data: {
            teacherId: profile.id,
            subjectId: s.subjectId,
            duration: s.duration,
            price: s.price, // рубли
          },
        });
      }

      return {
        ok: true,
        profileId: profile.id,
        userId,
      };
    });
  }

  // ===== UPDATE =====

  // multipart/form-data: photo?, aboutShort?, contact*, teacherSubjects(JSON)?
  // можно также прислать firstName/lastName/phone/email — обновятся у связанного User
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @UseInterceptors(FileInterceptor('photo'))
  async update(@Param('id') id: string, @UploadedFile() file: Express.Multer.File, @Body() body: any) {
    const subjects = this.parseSubjects(body.teacherSubjects);
    const photoPath = await this.saveUpload(file);

    return this.prisma.$transaction(async (tx) => {
      const current = await tx.teacherProfile.findUnique({
        where: { id },
        select: { userId: true },
      });
      if (!current) throw new BadRequestException('Teacher profile not found');

      // Обновляем профиль
      const data: any = {
        aboutShort: body.aboutShort ?? undefined,
        contactVk: body.contactVk ?? undefined,
        contactTelegram: body.contactTelegram ?? undefined,
        contactWhatsapp: body.contactWhatsapp ?? undefined,
        contactZoom: body.contactZoom ?? undefined,
        contactTeams: body.contactTeams ?? undefined,
        contactDiscord: body.contactDiscord ?? undefined,
        contactMax: body.contactMax ?? undefined,
      };
      if (photoPath) data.photo = photoPath;

      await tx.teacherProfile.update({ where: { id }, data });

      // Пришли ФИО/телефон/почта — обновим User
      if (
        'firstName' in body ||
        'lastName' in body ||
        'phone' in body ||
        'email' in body
      ) {
        await tx.user.update({
          where: { id: current.userId },
          data: {
            firstName: body.firstName ?? undefined,
            lastName: body.lastName ?? undefined,
            phone: body.phone ?? undefined,
            email: body.email ?? undefined,
          },
        });
      }

      // Перепривязка предметов, если список прислали
      if (Array.isArray(subjects) && subjects.length >= 0 && 'teacherSubjects' in body) {
        await tx.teacherSubject.deleteMany({ where: { teacherId: id } });
        for (const s of subjects) {
          await tx.teacherSubject.create({
            data: {
              teacherId: id,
              subjectId: s.subjectId,
              duration: s.duration,
              price: s.price,
            },
          });
        }
      }

      return { ok: true };
    });
  }

  // ===== SUBJECT LINKS (ручное добавление/удаление) =====

  @Post(':id/subjects')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async addSubject(
    @Param('id') teacherId: string,
    @Body() body: { subjectId: string; price: number; duration: number },
  ) {
    if (!body?.subjectId || !body?.price || !body?.duration) {
      throw new BadRequestException('subjectId, price, duration required');
    }
    return this.prisma.teacherSubject.create({
      data: {
        teacherId,
        subjectId: body.subjectId,
        price: Number(body.price), // рубли
        duration: Number(body.duration),
      },
    });
  }

  @Delete('subject-link/:linkId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async removeLink(@Param('linkId') linkId: string) {
    await this.prisma.teacherSubject.delete({ where: { id: linkId } });
    return { ok: true };
  }

  // ===== DELETE PROFILE (для каскадного удаления через админку) =====
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async removeProfile(@Param('id') id: string) {
    await this.prisma.$transaction(async (tx) => {
      await tx.teacherSubject.deleteMany({ where: { teacherId: id } });
      await tx.teacherProfile.delete({ where: { id } });
    });
    return { ok: true };
  }
}
