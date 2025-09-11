import {
  Body,
  Controller,
  Get,
  Post,
  Res,
  Req,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { PrismaService } from '../../prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';

@Controller('auth')
export class AuthController {
  private readonly log = new Logger(AuthController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  private cookieOpts() {
    const isProd = process.env.NODE_ENV === 'production';
    return {
      httpOnly: true,
      secure: isProd,                  // для cross-site обязательно true
      sameSite: isProd ? ('none' as const) : ('lax' as const),
      path: '/',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 дней
    };
  }

  @Post('login')
  async login(@Body() body: any, @Res({ passthrough: true }) res: Response) {
    try {
      // Поддерживаем и JSON, и x-www-form-urlencoded, и разные имена полей
      const ident = String(
        body?.loginOrEmail ?? body?.login ?? body?.email ?? '',
      ).trim();
      const password = String(body?.password ?? body?.pass ?? '').trim();

      if (!ident || !password) {
        throw new UnauthorizedException('invalid_credentials');
      }

      // Ищем по login/email (без телефона — чтобы избежать ошибок схемы)
      const user = await this.prisma.user.findFirst({
        where: { OR: [{ login: ident }, { email: ident }] },
      });
      if (!user) {
        throw new UnauthorizedException('invalid_credentials');
      }

      // Хеш пароля (поддерживаем разные исторические имена)
      const hash: string | null =
        (user as any).passwordHash ??
        (user as any).password ??
        (user as any).hash ??
        null;

      if (!hash) {
        throw new UnauthorizedException('invalid_credentials');
      }

      // Проверяем argon2 (у нас сид админа точно делает argon2)
      const ok = await argon2.verify(hash, password);
      if (!ok) {
        throw new UnauthorizedException('invalid_credentials');
      }

      const payload = {
        sub: user.id,
        id: user.id,
        role: (user as any).role,
        login: (user as any).login,
      };

      const token = await this.jwt.signAsync(payload, {
        secret: process.env.JWT_SECRET || 'dev',
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      });

      res.cookie('token', token, this.cookieOpts());
      return { ok: true, id: user.id, role: (user as any).role, login: (user as any).login };
    } catch (e: any) {
      // Чтобы не светить 500 на проде из-за несущественных различий формата,
      // логируем и отдаём uniform 401
      if (e instanceof UnauthorizedException) throw e;
      this.log.error('Login error', e?.stack || e?.message || String(e));
      throw new UnauthorizedException('invalid_credentials');
    }
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('token', { path: '/' });
    return { ok: true };
    }

  @Get('me')
  async me(@Req() req: Request) {
    // Если у тебя уже есть JwtGuard — можно оставить свой / удалить этот метод.
    const anyReq = req as any;
    const token = anyReq?.cookies?.token;
    if (!token) throw new UnauthorizedException('unauthorized');

    try {
      const payload = await this.jwt.verifyAsync(token, {
        secret: process.env.JWT_SECRET || 'dev',
      });
      const user = await this.prisma.user.findUnique({
        where: { id: payload?.sub },
        select: {
          id: true,
          login: true,
          role: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          balance: true,
          createdAt: true,
        },
      });
      if (!user) throw new UnauthorizedException('unauthorized');
      return user;
    } catch {
      throw new UnauthorizedException('unauthorized');
    }
  }
}
