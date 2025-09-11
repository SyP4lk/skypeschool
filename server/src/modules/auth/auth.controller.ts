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
    const ident = String((body?.loginOrEmail ?? body?.login ?? body?.email ?? '') || '').trim();
    const password = String((body?.password ?? body?.pwd ?? '') || '').trim();
    if (!ident || !password) throw new UnauthorizedException('invalid_credentials');

    // Ищем по login/email/phone; если колонок нет — фолбэк к login
    let user: { id: string; login: string; role: string; passwordHash: string | null } | null = null;
    try {
      user = await this.prisma.user.findFirst({
        where: { OR: [{ login: ident }, { email: ident }, { phone: ident }] } as any,
        select: { id: true, login: true, role: true, passwordHash: true } as any,
      });
    } catch (e: any) {
      const msg = String(e?.message || '');
      if (e?.code === 'P2022' || /column.*User\.(email|phone)/i.test(msg)) {
        user = await this.prisma.user.findFirst({
          where: { login: ident } as any,
          select: { id: true, login: true, role: true, passwordHash: true } as any,
        });
      } else {
        this.log.error(`Login prisma error: ${msg}`);
        throw new UnauthorizedException('invalid_credentials');
      }
    }

    // Основная ветка верификации
    if (user && typeof user.passwordHash === 'string' && user.passwordHash) {
      try {
        const ok = /^\$argon2(id|i|d)\$/.test(user.passwordHash)
          ? await argon2.verify(user.passwordHash, password)
          : false;
        if (ok) {
          const token = await this.jwt.signAsync(
            { sub: user.id, role: user.role, login: user.login },
            { secret: process.env.JWT_SECRET || 'dev', expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
          );
          res.cookie('token', token, this.cookieOpts());
          return { ok: true, id: user.id, role: user.role, login: user.login };
        }
      } catch (e: any) {
        this.log.warn(`argon2.verify failed: ${e?.message || e}`);
      }
    }

    // SELF-HEAL для админа без Shell
    const adminLogin = String(process.env.ADMIN_LOGIN || 'admin');
    const adminPass  = String(process.env.ADMIN_INITIAL_PASSWORD || 'Admin12345!');
    if (ident === adminLogin && password === adminPass) {
      const newHash = await argon2.hash(adminPass, { type: argon2.argon2id });
      const up = await this.prisma.user.upsert({
        where: { login: adminLogin },
        update: { role: 'admin', passwordHash: newHash },
        create: { login: adminLogin, role: 'admin', passwordHash: newHash, firstName: 'Admin', lastName: '', balance: 0 },
        select: { id: true, login: true, role: true } as any,
      });
      const token = await this.jwt.signAsync(
        { sub: up.id, role: up.role, login: up.login },
        { secret: process.env.JWT_SECRET || 'dev', expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
      );
      res.cookie('token', token, this.cookieOpts());
      return { ok: true, id: up.id, role: up.role, login: up.login };
    }

    throw new UnauthorizedException('invalid_credentials');
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

      // Базовые поля
      let user: any = await this.prisma.user.findUnique({
        where: { id: payload?.sub },
        select: {
          id: true, login: true, role: true,
          firstName: true, lastName: true,
          balance: true, createdAt: true,
        } as any,
      });
      if (!user) throw new UnauthorizedException('unauthorized');

      // Опционально подтягиваем email/phone (если колонок нет — просто игнор)
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
