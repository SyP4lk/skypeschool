import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const multer: any = require('multer');
import { extname } from 'path';
import * as fs from 'fs';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { TeachersService } from './teachers.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';

/**
 * Контроллер для администрирования преподавателей.
 * Все маршруты защищены авторизацией и требуют роли `admin`.
 */
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/teachers')
export class AdminTeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  /**
   * Получить список преподавателей для админки.
   */
  @Get()
  findAll() {
    return this.teachersService.findAllForAdmin();
  }

  /**
   * Получить подробную информацию о преподавателе по ID.
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.teachersService.findOneDetail(id);
  }

  /**
   * Создать нового преподавателя и его учётную запись.
   */
  @Post()
  @UseInterceptors(FileInterceptor('photo', {
    storage: multer.diskStorage({
      destination: (req: any, file: any, cb: any) => {
        const uploadPath = 'public/uploads';
        if (!fs.existsSync(uploadPath)) {
          fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
      },
      filename: (req: any, file: any, cb: any) => {
        // Генерируем уникальное имя файла, сохраняя исходное расширение
        const uniqueName = `${Date.now()}-${file.originalname}`;
        cb(null, uniqueName);
      },
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req: any, file: any, cb: any) => {
      // Разрешаем только изображения jpg, jpeg, png
      const allowed = ['.jpg', '.jpeg', '.png'];
      const ext = extname(file.originalname).toLowerCase();
      if (allowed.includes(ext)) {
        cb(null, true);
      } else {
        cb(new Error('Unsupported file type'), false);
      }
    },
  }))
  create(@UploadedFile() file: any, @Body() dto: CreateTeacherDto) {
    // Если клиент передал список предметов строкой (например, в multipart/form-data),
    // парсим его в объект. DTO ожидает массив объектов, поэтому конвертация нужна.
    if (typeof (dto as any).teacherSubjects === 'string') {
      try {
        (dto as any).teacherSubjects = JSON.parse((dto as any).teacherSubjects);
      } catch (e) {
        // если парсинг не удался, оставляем поле как есть
      }
    }
    // Если файл загружен, сохраняем относительный путь к нему в DTO
    if (file) {
      dto.photo = `/uploads/${file.filename}`;
    }
    return this.teachersService.createTeacher(dto);
  }

  /**
   * Обновить данные преподавателя. Изменять можно только «человеческие» поля.
   */
  @Put(':id')
  @UseInterceptors(FileInterceptor('photo', {
    storage: multer.diskStorage({
      destination: (req: any, file: any, cb: any) => {
        const uploadPath = 'public/uploads';
        if (!fs.existsSync(uploadPath)) {
          fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
      },
      filename: (req: any, file: any, cb: any) => {
        const uniqueName = `${Date.now()}-${file.originalname}`;
        cb(null, uniqueName);
      },
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req: any, file: any, cb: any) => {
      const allowed = ['.jpg', '.jpeg', '.png'];
      const ext = extname(file.originalname).toLowerCase();
      if (allowed.includes(ext)) {
        cb(null, true);
      } else {
        cb(new Error('Unsupported file type'), false);
      }
    },
  }))
  update(
    @Param('id') id: string,
    @UploadedFile() file: any,
    @Body() dto: UpdateTeacherDto,
  ) {
    // Аналогично парсим teacherSubjects из строки, если она пришла строкой
    if (dto && typeof (dto as any).teacherSubjects === 'string') {
      try {
        (dto as any).teacherSubjects = JSON.parse((dto as any).teacherSubjects);
      } catch (e) {
        // игнорируем ошибку парсинга
      }
    }
    if (file) {
      dto.photo = `/uploads/${file.filename}`;
    }
    return this.teachersService.updateTeacher(id, dto);
  }

  /**
   * Пометить преподавателя неактивным (soft delete).
   */
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.teachersService.removeTeacher(id);
  }
}