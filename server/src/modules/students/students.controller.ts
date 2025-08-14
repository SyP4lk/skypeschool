import { Body, Controller, Get, Param, Post, Put, Delete, UseGuards, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import * as argon2 from 'argon2';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('students')
export class StudentsController {
  constructor(private prisma: PrismaService) {}

   @Get()
  async list() {
    return this.prisma.user.findMany({
      where: {
        role: 'student', NOT: { login: { contains: '__deleted__' } } , // <— скрываем soft-deleted
      },
      select: {
        id: true, login: true, firstName: true, lastName: true,
        tz: true, balance: true, createdAt: true, studentProfile: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Roles('admin')
  @Post()
  async create(@Body() body: { login: string; password: string; firstName?: string; lastName?: string; tz?: string }) {
    if (!body.login?.trim() || !body.password?.trim()) {
      throw new BadRequestException('login and password are required');
    }
    const login = body.login.trim().toLowerCase();
    const exists = await this.prisma.user.findUnique({ where: { login } });
    if (exists) throw new BadRequestException('user exists');

    const hash = await argon2.hash(body.password);
    const user = await this.prisma.user.create({
      data: {
        login,
        passwordHash: hash,
        role: 'student',
        firstName: body.firstName ?? null,
        lastName: body.lastName ?? null,
        tz: body.tz ?? undefined,
        studentProfile: { create: {} },
      },
      select: { id: true, login: true, role: true },
    });
    return user;
  }

  @Roles('admin')
  @Put(':id')
  async update(@Param('id') id: string, @Body() data: { firstName?: string; lastName?: string; tz?: string; balance?: number }) {
    return this.prisma.user.update({ where: { id }, data });
  }

  @Roles('admin')
  @Delete(':id')
  async remove(@Param('id') id: string) {
    // Soft-delete: сохраняем пользователя (FK на уроки), удаляем профиль, деактивируем логин/пароль.
    const u = await this.prisma.user.findUnique({ where: { id } });
    if (!u) return { ok: true };

    await this.prisma.studentProfile.deleteMany({ where: { userId: id } });

    const newLogin = `${u.login}__deleted__${Date.now()}`;
    const newPass = await argon2.hash(`deleted-${Date.now()}-${Math.random()}`);

    await this.prisma.user.update({
      where: { id },
      data: {
        login: newLogin,
        passwordHash: newPass,
        firstName: null,
        lastName: null,
        balance: 0,
      },
    });

    return { ok: true };
  }
}
