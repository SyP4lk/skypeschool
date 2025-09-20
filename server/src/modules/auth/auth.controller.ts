import {
  BadRequestException,
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

  // ---------- REGISTER ----------
  @Post('register')
  async register(@Req() req: Request, @Res({ passthrough: true }) res: Response, @Body() raw: any) {
    const body: any = (raw && typeof raw === 'object') ? raw : ((req as any).body || {});
    const login  = String(body?.login ?? '').trim();
    const email  = String(body?.email ?? '').trim();
    const pwd    = String(body?.password ?? '').trim();
    const first  = String(body?.firstName ?? '').trim();
    const last   = String(body?.lastName ?? '').trim();
    const phone  = String(body?.phone ?? '').replace(/\D+/g, '');
    // messenger: "telegram:@nick"/"whatsapp:+7900..." — в User не пишем, чтоб не падать на отсутствующей колонке

    if (!first || !last || !pwd || !phone) {
      throw new BadRequestException({ message: 'required_fields' });
    }
    if (!login && !email) {
      throw new BadRequestException({ message: 'login_or_email_required' });
    }

    const userCols: Array<{ column_name: string }> = await this.prisma.$queryRawUnsafe(`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema='public' AND table_name='User'
    `);
    const hasUser = (c: string) => userCols.some(x => x.column_name.toLowerCase() === c.toLowerCase());

    if (login && hasUser('login')) {
      const exists = await this.prisma.user.findFirst({ where: { login } as any, select: { id: true } as any });
      if (exists) throw new BadRequestException({ message: 'login_taken' });
    }
    if (email && hasUser('email')) {
      const exists = await this.prisma.user.findFirst({ where: { email } as any, select: { id: true } as any });
      if (exists) throw new BadRequestException({ message: 'email_taken' });
    }

    const passwordHash = await argon2.hash(pwd, { type: argon2.argon2id });

    const data: any = {};
    if (hasUser('login')     && login)   data.login = login;
    if (hasUser('email')     && email)   data.email = email;
    if (hasUser('passwordHash'))         data.passwordHash = passwordHash;
    if (hasUser('firstName'))            data.firstName = first;
    if (hasUser('lastName'))             data.lastName = last;
    if (hasUser('phone'))                data.phone = phone;
    if (hasUser('role'))                 data.role = 'student';
    if (hasUser('balance'))              data.balance = 0;

    const user = await this.prisma.user.create({ data } as any);

    // ---- FIX: создаём профиль без ON CONFLICT (безопасно при отсутствии уникального индекса) ----
    await this.prisma.$executeRawUnsafe(
      `
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema='public' AND table_name='StudentProfile'
        ) THEN
          INSERT INTO "StudentProfile" ("userId")
          SELECT $1
          WHERE NOT EXISTS (
            SELECT 1 FROM "StudentProfile" WHERE "userId" = $1
          );
        END IF;
      END$$;
      `,
      user.id,
    );

    const token = await this.jwt.signAsync(
      { sub: user.id, role: user.role || 'student', login: user.login || login || email },
      { secret: process.env.JWT_SECRET || 'dev', expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
    );
    res.cookie('token', token, this.cookieOpts());

    return { ok: true, id: user.id, role: user.role || 'student', login: user.login || login || email };
  }

  // ---------- LOGIN (как было) ----------
  @Post('login')
  async login(@Body() body: any, @Res({ passthrough: true }) res: Response) {
    const ident = String((body?.loginOrEmail ?? body?.login ?? body?.email ?? '') || '').trim();
    const password = String((body?.password ?? body?.pwd ?? '') || '').trim();
    if (!ident || !password) throw new UnauthorizedException('invalid_credentials');

    let user: any = null;
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

  // ---------- ME (как было) ----------
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
