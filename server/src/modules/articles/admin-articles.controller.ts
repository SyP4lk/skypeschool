import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Delete,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { extname } from 'path';
import * as fs from 'fs';
import { ArticlesService } from './articles.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const multer: any = require('multer');

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, destination: string) => void,
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
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, filename: string) => void,
  ) => {
    const ext = extname(file.originalname || '').toLowerCase();
    const base = (file.originalname || 'image').replace(/\.[^/.]+$/, '');
    const safe = base.toLowerCase().replace(/[^a-z0-9-_]+/g, '-').slice(0, 50) || 'image';
    cb(null, `${Date.now()}-${safe}${ext}`);
  },
});

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/articles')
export class AdminArticlesController {
  constructor(private readonly articles: ArticlesService) {}

  @Get(':id')
  async getOne(@Param('id') id: string) {
    const a = await this.articles.findById(id);
    if (!a) throw new BadRequestException('not found');
    return a;
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('image', {
      storage,
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async create(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body('title') title: string,
    @Body('content') content: string,
  ) {
    if (!title?.trim()) throw new BadRequestException('title is required');
    if (!content?.trim()) throw new BadRequestException('content is required');

    const image = file ? `/uploads/${file.filename}` : null;
    return this.articles.create({ title: title.trim(), content, image });
  }

  @Patch(':id')
  @UseInterceptors(
    FileInterceptor('image', {
      storage,
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async update(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body('title') title?: string,
    @Body('content') content?: string,
  ) {
    if (!title && !content && !file) {
      throw new BadRequestException('no changes provided');
    }
    const patch: any = {};
    if (typeof title === 'string') {
      if (!title.trim()) throw new BadRequestException('title cannot be empty');
      patch.title = title.trim();
    }
    if (typeof content === 'string') {
      if (!content.trim()) throw new BadRequestException('content cannot be empty');
      patch.content = content;
    }
    if (file) patch.image = `/uploads/${file.filename}`;
    return this.articles.update(id, patch);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.articles.remove(id);
    return { ok: true };
  }
}
