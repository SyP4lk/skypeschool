import {
  BadRequestException,
  Controller,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

// ВАЖНО: дефолт + именованный импорт
import multer, { diskStorage } from 'multer';

import type { Request } from 'express';
import { existsSync, mkdirSync } from 'fs';
import { join, extname } from 'path';

// допустимые расширения
function safeExt(original: string) {
  const ext = extname(original || '').toLowerCase();
  const ok = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
  return ok.has(ext) ? ext : '.jpg';
}

@Controller('admin/teachers')
export class UploadController {
  @Post(':id/photo')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (
          _req: Request,
          _file: Express.Multer.File,
          cb: (err: any, dest: string) => void,
        ) => {
          const dir = join(process.cwd(), 'uploads', 'teachers');
          if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
          cb(null, dir);
        },
        filename: (
          req: Request,
          file: Express.Multer.File,
          cb: (err: any, fileName: string) => void,
        ) => {
          const id = String((req.params as any)?.id || 'unknown');
          const ext = safeExt(file?.originalname || '');
          cb(null, `${id}${ext}`);
        },
      }),

      // Без жёстких типов (совместимо со всеми версиями типов Multer)
      fileFilter: (_req, file, cb) => {
        const ok = /image\/(jpe?g|png|webp|gif)/i.test(file.mimetype);
        cb(null, ok);
      },

      limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    }),
  )
  async upload(
    @Param('id') id: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!id) throw new BadRequestException('teacher id required');
    if (!file) throw new BadRequestException('file required');

    const publicUrl = `/uploads/teachers/${file.filename}`;
    return { ok: true, url: publicUrl };
  }
}
