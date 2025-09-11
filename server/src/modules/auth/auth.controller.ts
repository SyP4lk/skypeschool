import {
  Controller, Post, Get, Body, Res, Req,
  UnauthorizedException
} from '@nestjs/common';
import { Response, Request } from 'express';
import { PrismaService } from '../../prisma.service';
import { JwtService } from '@nestjs/jwt';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  private cookieOpts() {
    const isProd = process.env.NODE_ENV === 'production';
    return {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? ('none' as const) : ('lax' as const),
      path: '/',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 дней
    };
  }

  @Post('login')
  async login(@Body() body: any, @Res({ passthrough: true }) res: Response) {
    // Поддерживаем и JSON, и x-www-form-urlencoded
    const ident = String(
      body?.loginOrEmail ?? body?.login ?? body?.email ?? body?.username ?? ''
    ).trim();
    const password = String(body?.password ?? body?.pass ?? '').trim();

    if (!ident || !password) {
      throw new UnauthorizedException('invalid_credentials');
    }

    // Ищем по login/email/phone (телефон оставляем как прислали — нормализация в сервисах не обязательна)
    const user = await this.prisma.user.findFirst({
      where: { OR: [{ login: ident }, { email: ident }, { phone: ident }] },
    });
    if (!user) throw new UnauthorizedException('invalid_credentials');

    // Достаём хеш с учётом возможных старых имён поля
    const hash: string | null =
      (user as any).passwordHash ?? (user as any).password ?? (user as any).hash ?? null;
    if (!hash) throw new UnauthorizedException('invalid_credentials');

    // Универсальная проверка: argon2 → bcrypt/bcryptjs → fallback (если вдруг хранится в явном виде)
    const ok = await (async () => {
      try {
        if (hash.startsWith('$argon2')) {
          const argon2 = require('argon2');
          return await argon2.verify(hash, password);
        }
        if (hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$')) {
          try {
            const b = require('bcrypt');
            return await b.compare(password, hash);
          } catch {
            const bjs = require('bcryptjs');
            return await bjs.compare(password, hash);
          }
        }
        return password === hash;
      } catch {
        return false;
      }
    })();

    if (!ok) throw new UnauthorizedException('invalid_credentials');

    const token = await this.jwt.signAsync(
      { sub: user.id, role: (user as any).role, login: (user as any).login },
      { secret: process.env.JWT_SECRET || 'dev', expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
    );

    res.cookie('token', token, this.cookieOpts());

    return {
      ok: true,
      id: user.id,
      role: (user as any).role,
      login: (user as any).login,
    };
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('token', { path: '/' });
    return { ok: true };
  }

  @Get('me')
  async me(@Req() req: Request) {
    const anyReq = req as any;
    const token = anyReq?.cookies?.token;
    if (!token) throw new UnauthorizedException('unauthorized');

    try {
      const payload = await this.jwt.verifyAsync(token, {
        secret: process.env.JWT_SECRET || 'dev',
      });
      const user = await this.prisma.user.findUnique({ where: { id: payload?.sub } });
      if (!user) throw new UnauthorizedException('unauthorized');

      return {
        id: user.id,
        login: (user as any).login,
        role: (user as any).role,
        email: (user as any).email ?? null,
        phone: (user as any).phone ?? null,
        firstName: (user as any).firstName ?? null,
        lastName: (user as any).lastName ?? null,
        balance: (user as any).balance ?? 0,
        createdAt: (user as any).createdAt,
      };
    } catch {
      throw new UnauthorizedException('unauthorized');
    }
  }
}
