import {
  BadRequestException,
  Body, Controller, Delete, Get, Param, Patch, Post, Query,
  UseGuards, NotFoundException, ForbiddenException
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import * as argon2 from 'argon2';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/users')
export class AdminUsersController {
  constructor(private prisma: PrismaService) {}

  @Roles('admin')
  @Get()
  async list(
    @Query('role') role: 'student' | 'teacher' | 'all' = 'all',
    @Query('query') query = '', @Query('offset') offset = '0', @Query('limit') limit = '50',
  ) {
    const where: any = {
      ...(role !== 'all' ? { role } : {}),
      ...(query ? { OR: [
        { login: { contains: query, mode: 'insensitive' } },
        { firstName: { contains: query, mode: 'insensitive' } },
        { lastName: { contains: query, mode: 'insensitive' } },
      ] } : {}),
    };
    const [total, items] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where, orderBy: { createdAt: 'desc' },
        skip: Number(offset) || 0, take: Math.min(Number(limit) || 50, 200),
        select: { id: true, login: true, firstName: true, lastName: true, role: true, balance: true },
      }),
    ]);
    return { items, total };
  }

  // NEW: детальная карточка (общая для любой роли)
  @Roles('admin')
  @Get(':id')
  async getOne(@Param('id') id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, login: true, firstName: true, lastName: true, role: true, balance: true, tz: true },
    });
    if (!user) throw new NotFoundException();
    return { user };
  }

  // создание (как было)
  @Roles('admin')
  @Post()
  async create(@Body() body: {
    role: 'student'|'teacher'; login: string; password?: string; firstName?: string; lastName?: string; tz?: string;
  }) {
    const { role, login } = body;
    if (!['student','teacher'].includes(role)) throw new BadRequestException('role must be student|teacher');
    if (!login) throw new BadRequestException('login required');

    const exists = await this.prisma.user.findUnique({ where: { login } });
    if (exists) throw new BadRequestException('login already exists');

    const password = body.password && body.password.length >= 8
      ? body.password : Math.random().toString(36).slice(-10);
    const passwordHash = await argon2.hash(password);

    const user = await this.prisma.user.create({
      data: { login, passwordHash, role, firstName: body.firstName || null, lastName: body.lastName || null, tz: body.tz || 'Europe/Moscow' },
      select: { id: true, login: true, firstName: true, lastName: true, role: true, balance: true },
    });

    if (role === 'student') await this.prisma.studentProfile.create({ data: { userId: user.id } });
    else await this.prisma.teacherProfile.create({ data: { userId: user.id, isActive: true } });

    return { ok: true, user, newPassword: body.password ? undefined : password };
  }

  // обновление ФИО
  @Roles('admin')
  @Patch(':id')
  async updateNames(@Param('id') id: string, @Body() body: { firstName?: string|null; lastName?: string|null }) {
    const user = await this.prisma.user.update({
      where: { id }, data: { firstName: body.firstName ?? null, lastName: body.lastName ?? null },
      select: { id: true, login: true, firstName: true, lastName: true, role: true, balance: true },
    });
    return { user };
  }

  // NEW: смена пароля (для teacher; ученики меняются через /admin/students/:id/password)
  @Roles('admin')
  @Post(':id/password')
  async setPassword(@Param('id') id: string, @Body() body: { newPassword?: string }) {
    const user = await this.prisma.user.findUnique({ where: { id }, select: { role: true } });
    if (!user) throw new NotFoundException();
    if (user.role === 'admin') throw new ForbiddenException('cannot change admin password here');

    const password = (body.newPassword || '').trim();
    if (!password || password.length < 8) throw new BadRequestException('Пароль минимум 8 символов');

    const passwordHash = await argon2.hash(password);
    await this.prisma.user.update({ where: { id }, data: { passwordHash } });
    return { ok: true };
  }

  // баланс
  @Roles('admin') @Get(':id/balance')
  async balance(@Param('id') id: string) {
    const row = await this.prisma.user.findUnique({ where: { id }, select: { balance: true } });
    if (!row) throw new NotFoundException();
    return { balance: row.balance };
  }

  // удаление
  @Roles('admin') @Delete(':id')
  async remove(@Param('id') id: string) {
    const row = await this.prisma.user.findUnique({ where: { id }, select: { id: true, role: true } });
    if (!row) throw new NotFoundException();
    if (row.role === 'admin') throw new ForbiddenException('cannot delete admin');
    await this.prisma.studentProfile.deleteMany({ where: { userId: id } });
    await this.prisma.teacherProfile.deleteMany({ where: { userId: id } });
    await this.prisma.user.delete({ where: { id } });
    return { ok: true };
  }
}
