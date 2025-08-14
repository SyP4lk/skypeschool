import { Controller, Get, Post, Req, Res, UseGuards, HttpCode, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './local.guard';
import { JwtAuthGuard } from './jwt.guard';
import { Response } from 'express';
import * as argon2 from 'argon2';
import { PrismaService } from '../../prisma.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService, private readonly prisma: PrismaService) {}

  @UseGuards(LocalAuthGuard)
  @HttpCode(200)
  @Post('login')
  async login(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    const token = await this.auth.sign({
      id: req.user.id,
      login: req.user.login,
      role: req.user.role,
    });
    const isHttps = process.env.NODE_ENV === 'production';
    res.cookie('token', token, {
      httpOnly: true,
      sameSite: isHttps ? 'none' : 'lax',
      secure: isHttps,
      path: '/',
      maxAge: 7 * 24 * 3600 * 1000,
    });
    return { ok: true, user: { id: req.user.id, login: req.user.login, role: req.user.role } };
  }

  // РЕГИСТРАЦИЯ УЧЕНИКА (исправлено)
  @Post('register-student')
  @HttpCode(200)
  async registerStudent(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    const body = req.body || {};
    const login = (body.login ?? '').trim().toLowerCase();
    const password = (body.password ?? '').trim();
    const firstName = (body.firstName ?? null);
    const lastName = (body.lastName ?? null);

    if (!login || !password) throw new BadRequestException('login and password required');

    const exists = await this.prisma.user.findUnique({ where: { login } });
    if (exists) throw new BadRequestException('user exists');

    const user = await this.prisma.user.create({
      data: {
        login,
        firstName,
        lastName,
        role: 'student',
        passwordHash: await argon2.hash(password),
        studentProfile: { create: {} },
      },
    });

    const token = await this.auth.sign({ id: user.id, login: user.login, role: user.role });
    const isHttps = process.env.NODE_ENV === 'production';
    res.cookie('token', token, {
      httpOnly: true,
      sameSite: isHttps ? 'none' : 'lax',
      secure: isHttps,
      path: '/',
      maxAge: 7 * 24 * 3600 * 1000,
    });
    return { ok: true, user: { id: user.id, login: user.login, role: user.role } };
  }

  @Post('logout')
  @HttpCode(200)
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('token', { path: '/' });
    return { ok: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Req() req: any) {
    return this.auth.me(req.user.sub);
  }
}
