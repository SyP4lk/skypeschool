import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request, Response } from 'express';
import type { CookieOptions } from 'express-serve-static-core';
import * as argon2 from 'argon2';
import { PrismaService } from '../../prisma.service';

function parseDurationMs(input: string | undefined, fallbackMs: number): number {
  if (!input) return fallbackMs;
  const s = String(input).trim().toLowerCase();
  const m = s.match(/^(\d+)\s*(ms|s|m|h|d)?$/);
  if (!m) return fallbackMs;
  const n = Number(m[1]);
  const unit = m[2] || 's';
  switch (unit) {
    case 'ms': return n;
    case 's': return n * 1000;
    case 'm': return n * 60 * 1000;
    case 'h': return n * 60 * 60 * 1000;
    case 'd': return n * 24 * 60 * 60 * 1000;
    default: return fallbackMs;
  }
}

@Controller('auth')
export class AuthController {
  private readonly log = new Logger('AuthController');

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  private cookieBase(): CookieOptions {
    const isProd = process.env.NODE_ENV === 'production';
    const sameSite: CookieOptions['sameSite'] = isProd ? 'none' : 'lax';
    return { httpOnly: true, secure: isProd, sameSite, path: '/' };
  }
  private cookieOpts(): CookieOptions {
    const maxAge = parseDurationMs(process.env.JWT_EXPIRES_IN || '7d', 7 * 24 * 60 * 60 * 1000);
    return { ...this.cookieBase(), maxAge };
  }

  @Post('login')
  async login(@Body() body: any, @Res({ passthrough: true }) res: Response) {
    // Принимаем JSON и x-www-form-urlencoded; нормализуем поля
    const ident = String((body?.loginOrEmail ?? body?.login ?? body?.email ?? '')).trim();
    const password = String((body?.password ?? body?.pwd ?? '')).trim();
    if (!ident || !password) throw new UnauthorizedException('invalid_credentials');

    // Ищем по login/email/phone; если колонок нет — фолбэк к login
    let user: any = null;
    try {
      user = await this.prisma.user.findFirst({
        where: { OR: [{ login: ident }, { email: ident }, { phone: ident }] } as any,
        select: { id: true, login: true, role: true, passwordHash: true, password: true, hash: true } as any,
      });
    } catch (e: any) {
      const msg = String(e?.message || '');
      if (e?.code === 'P2022' || /column.*User\.(email|phone)/i.test(msg)) {
        user = await this.prisma.user.findFirst({
          where: { login: ident } as any,
          select: { id: true, login: true, role: true, passwordHash: true, password: true, hash: true } as any,
        });
      } else {
        this.log.error(`Login prisma error: ${msg}`);
        throw new UnauthorizedException('invalid_credentials');
      }
    }
    if (!user) throw new UnauthorizedException('invalid_credentials');

    const hash: unknown = user.passwordHash ?? user.password ?? user.hash ?? null;
    if (typeof hash !== 'string' || !hash) throw new UnauthorizedException('invalid_credentials');

    // Только argon2 (по ТЗ). Любые другие/битые хэши => неверный пароль.
    let ok = false;
    try {
      ok = /^\$argon2(id|i|d)\$/.test(hash) ? await argon2.verify(hash, password) : false;
    } catch (e: any) {
      this.log.warn(`argon2.verify failed: ${e?.message || e}`);
      ok = false;
    }
    if (!ok) throw new UnauthorizedException('invalid_credentials');

    const token = await this.jwt.signAsync(
      { sub: user.id, role: user.role, login: user.login },
      { secret: process.env.JWT_SECRET || 'dev', expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
    );

    res.cookie('token', token, this.cookieOpts());
    return { ok: true, id: user.id, role: user.role, login: user.login };
  }

  @Get('me')
  async me(@Req() req: Request) {
    try {
      const token =
        (req as any).cookies?.token ||
        (req.headers?.authorization || '').replace(/^Bearer\s+/i, '');
      if (!token) throw new UnauthorizedException('unauthorized');

      const payload = await this.jwt.verifyAsync(token, {
        secret: process.env.JWT_SECRET || 'dev',
      });

      let user: any = await this.prisma.user.findUnique({
        where: { id: payload?.sub },
        select: {
          id: true, login: true, role: true,
          firstName: true, lastName: true,
          balance: true, createdAt: true,
        } as any,
      });
      if (!user) throw new UnauthorizedException('unauthorized');

      try {
        const ext = await this.prisma.user.findUnique({
          where: { id: payload?.sub },
          select: { email: true, phone: true } as any,
        });
        if (ext) {
          user.email = ext.email ?? user.email;
          user.phone = ext.phone ?? user.phone;
        }
      } catch {}

      return user;
    } catch {
      throw new UnauthorizedException('unauthorized');
    }
  }
}
