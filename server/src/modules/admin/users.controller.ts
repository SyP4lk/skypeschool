import {
  BadRequestException,
  Body, Controller, Delete, Get, Param, Patch, Post, Query,
  UseGuards, NotFoundException
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
 @Roles('admin')
@Get()
async list(
  @Query('q') q = '',
  @Query('role') role?: string,
  @Query('page') pageStr = '1',
  @Query('limit') limitStr = '20'
) {
  const page = Math.max(parseInt(pageStr) || 1, 1);
  const take = Math.min(Math.max(parseInt(limitStr) || 20, 1), 100);
  const skip = (page - 1) * take;

  const where: any = {};
  if (q) where.OR = [
    { login: { contains: q } },
    { email: { contains: q } },
    { phone: { contains: q } },
  ];
  if (role) where.role = role;

  // ⬇ не показываем soft-deleted (login содержит "__deleted__")
  where.AND = [...(where.AND || []), { NOT: { login: { contains: '__deleted__' } } }];

  const [items, total] = await Promise.all([
    this.prisma.user.findMany({
      where, skip, take, orderBy: { createdAt: 'desc' },
      select: {
        id: true, login: true, role: true,
        firstName: true, lastName: true,
        phone: true, email: true,
        balance: true, createdAt: true,
      } as any,
    }),
    this.prisma.user.count({ where }),
  ]);
  return { items, total, page, limit: take };
}

  @Roles('admin')
  @Get(':id')
  async read(@Param('id') id: string) {
    const u = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true, login: true, role: true,
        firstName: true, lastName: true,
        createdAt: true, email: true, phone: true,
      } as any,
    });
    if (!u) throw new NotFoundException('user_not_found');
    return { user: u };
  }

  @Roles('admin')
  @Post()
  async create(@Body() body: any = {}) {
    const { login, password, role, email, phone, firstName, lastName } = body || {};
    if (!login || !password || !role) throw new BadRequestException('login_password_role_required');
    const passwordHash = await argon2.hash(password);
    try {
      return await this.prisma.user.create({
        data: {
          login, role, passwordHash,
          email: email || null, phone: phone || null,
          firstName: firstName || null, lastName: lastName || null,
        } as any,
      });
    } catch (e: any) {
      // Prisma P2002 → определить конфликтующее поле
      if (e?.code === 'P2002') {
        const t = e?.meta?.target; // может быть массивом или названием индекса
        const s = Array.isArray(t) ? t.join(',') : String(t || '');
        if (s.includes('login'))  throw new BadRequestException('login_taken');
        if (s.includes('email'))  throw new BadRequestException('email_taken');
        if (s.includes('phone'))  throw new BadRequestException('phone_taken');
        throw new BadRequestException('unique_constraint_violation');
      }
      throw e;
}

  }

  @Roles('admin')
  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: any = {}) {
    if (!body || typeof body !== 'object') throw new BadRequestException('empty_body');
    const data: any = {};
    if ('firstName' in body) data.firstName = body.firstName ?? null;
    if ('lastName'  in body) data.lastName  = body.lastName  ?? null;
    if ('email'     in body) { const e = (body.email ?? '').trim(); data.email = e || null; }
    if ('phone'     in body) { const p = (body.phone ?? '').trim(); data.phone = p || null; }

    try {
      return await this.prisma.user.update({
        where: { id },
        data,
        select: {
          id: true, login: true, role: true,
          firstName: true, lastName: true,
          email: true, phone: true,
          createdAt: true,
        } as any,
      });
    } catch (e: any) {
      if (e?.code === 'P2002') throw new BadRequestException('unique_constraint_violation');
      throw e;
    }
  }

  @Roles('admin')
  @Post(':id/password')
  async changePassword(@Param('id') id: string, @Body() body: any = {}) {
    const pwdRaw = body?.newPassword ?? body?.password ?? '';
    const pwd = String(pwdRaw || '');
    if (pwd.length < 8) throw new BadRequestException('password_too_short');
    const passwordHash = await argon2.hash(pwd);
    return this.prisma.user.update({ where: { id }, data: { passwordHash } });
  }

  @Roles('admin')
  @Get(':id/balance')
  async balance(@Param('id') id: string) {
    try {
      const u = await (this.prisma as any).user.findUnique({
        where: { id }, select: { balance: true } as any,
      });
      return { balance: Number((u as any)?.balance ?? 0), currency: 'RUB' };
    } catch { return { balance: 0, currency: 'RUB' }; }
  }

  @Roles('admin')
  @Delete(':id')
  async remove(@Param('id') id: string) {
    const u = await this.prisma.user.findUnique({ where: { id }, select: { login: true } as any });
    if (!u) throw new NotFoundException('user_not_found');
    const stamp = new Date().toISOString().slice(0,10).replace(/-/g,'');
    await this.prisma.user.update({
      where: { id },
      data: { login: `${(u as any).login}__deleted__${stamp}`.slice(0,150) } as any,
    });
    return { ok: true };
  }
}
