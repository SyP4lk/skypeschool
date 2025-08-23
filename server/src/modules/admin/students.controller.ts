import {
  BadRequestException,
  Body,
  Controller,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import * as argon2 from 'argon2';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { extname } from 'path';
import * as fs from 'fs';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const multer: any = require('multer');

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// ВАЖНО: типы у параметров destination/filename — снимают TS7006
const storage = multer.diskStorage({
  destination: (
    _req: Request,
    _file: Express.Multer.File,
    cb: (e: Error | null, dest: string) => void,
  ) => {
    const dir = 'public/uploads';
    try {
      ensureDir(dir);
      cb(null, dir);
    } catch (e: any) {
      cb(e, dir);
    }
  },
  filename: (
    _req: Request,
    file: Express.Multer.File,
    cb: (e: Error | null, filename: string) => void,
  ) => {
    const ext = extname(file.originalname || '').toLowerCase();
    const base = (file.originalname || 'avatar').replace(/\.[^/.]+$/, '');
    const safe =
      base.toLowerCase().replace(/[^a-z0-9-_]+/g, '-').slice(0, 50) ||
      'avatar';
    cb(null, `${Date.now()}-${safe}${ext}`);
  },
});

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/students')
export class AdminStudentsController {
  constructor(private prisma: PrismaService) {}

  @Roles('admin')
  @Patch(':id')
  async updateProfile(
    @Param('id') id: string,
    @Body()
    body: {
      firstName?: string | null;
      lastName?: string | null;
      contactSkype?: string | null;
      contactVk?: string | null;
      contactGoogle?: string | null;
      contactWhatsapp?: string | null;
      contactMax?: string | null;
      contactDiscord?: string | null;
    },
  ) {
    await this.prisma.user.update({
      where: { id },
      data: {
        firstName: body.firstName ?? null,
        lastName: body.lastName ?? null,
      },
    });

    await this.prisma.studentProfile.upsert({
      where: { userId: id },
      update: {
        contactSkype: body.contactSkype ?? null,
        contactVk: body.contactVk ?? null,
        contactGoogle: body.contactGoogle ?? null,
        contactWhatsapp: body.contactWhatsapp ?? null,
        contactMax: body.contactMax ?? null,
        contactDiscord: body.contactDiscord ?? null,
      },
      create: {
        userId: id,
        contactSkype: body.contactSkype ?? null,
        contactVk: body.contactVk ?? null,
        contactGoogle: body.contactGoogle ?? null,
        contactWhatsapp: body.contactWhatsapp ?? null,
        contactMax: body.contactMax ?? null,
        contactDiscord: body.contactDiscord ?? null,
      },
    });

    return { ok: true };
  }

  @Roles('admin')
  @Post(':id/password')
  async setPassword(
    @Param('id') id: string,
    @Body() body: { newPassword?: string },
  ) {
    const password = (body.newPassword || '').trim();
    if (!password || password.length < 8) {
      throw new BadRequestException('Пароль минимум 8 символов');
    }
    const passwordHash = await argon2.hash(password);
    await this.prisma.user.update({ where: { id }, data: { passwordHash } });
    return { newPassword: password };
  }

  @Roles('admin')
  @Post(':id/avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      storage,
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async uploadAvatar(
    @Param('id') id: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Файл обязателен');
    const image = `/uploads/${file.filename}`;
    await this.prisma.studentProfile.upsert({
      where: { userId: id },
      update: { avatar: image },
      create: { userId: id, avatar: image },
    });
    return { ok: true, image };
  }
}
