import {
  BadRequestException,
  Body,
  ConflictException,
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

  private cookieOpts(): CookieOptions {
    const isProd = process.env.NODE_ENV === 'production';
    const maxAge = parseDurationMs(
      process.env.JWT_EXPIRES_IN || '7d',
      7 * 24 * 60 * 60 * 1000
    );
    const sameSite: CookieOptions['sameSite'] = isProd ? 'none' : 'lax';
    const opts: CookieOptions = {
      httpOnly: true,
      secure: isProd,
      sameSite,
      path: '/',
      maxAge,
    };
    return opts;
  }

  @Post('register')
  async register(
    @Body() body: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const login = String(body?.login || '').trim();
    const email = String(body?.email || '').trim();
    const password = String(body?.password || '').trim();
    const firstName = String(body?.firstName || '').trim();
    const lastName  = String(body?.lastName || '').trim();
    const phone     = String(body?.phone || '').trim();       // ✅ телефон
    const messengerType = String(body?.messengerType || '').trim();
    const messengerVal  = String(body?.messenger || '').trim();

    if (!password || !firstName || !lastName || !messengerVal || !phone || (!login && !email)) {
      throw new BadRequestException('required_fields');
    }

    const messengerNote = messengerType ? `${messengerType}:${messengerVal}` : messengerVal;

    if (login) {
      const exists = await this.prisma.user.findUnique({ where: { login } }).catch(() => null);
      if (exists) throw new ConflictException('login_taken');
    }
    if (email) {
      try {
        const euser = await (this.prisma as any).user.findUnique({ where: { email } });
        if (euser) throw new ConflictException('email_taken');
      } catch (e: any) {
        if (!(e?.code === 'P2022' || /column.*User\.email/i.test(String(e?.message || '')))) {
          throw e;
        }
      }
    }

    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

    const created = await (this.prisma as any).user.create({
      data: {
        login: login || undefined,
        email: email || undefined,
        role: 'student',
        passwordHash,
        firstName,
        lastName,
        phone: phone || undefined,
        messenger: messengerNote || undefined,
        balance: 0,
      },
      select: { id: true, login: true, role: true },
    });

    const token = await this.jwt.signAsync(
      { sub: created.id, role: created.role, login: created.login },
      { secret: process.env.JWT_SECRET || 'dev', expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
    );
    res.cookie('token', token, this.cookieOpts());
    return { ok: true, id: created.id, role: created.role, login: created.login };
  }

  @Post('login')
  async login(
    @Body() body: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ident = String(
      (body?.loginOrEmail ?? body?.login ?? body?.email ?? '').toString(),
    ).trim();
    const password = String((body?.password ?? body?.pwd ?? '')).toString();

    if (!ident || !password) {
      throw new UnauthorizedException('invalid_credentials');
    }

    let user: any = null;
    try {
      user = await this.prisma.user.findFirst({
        where: { OR: [{ login: ident }, { email: ident }, { phone: ident }] } as any,
      });
    } catch (e: any) {
      const msg = String(e?.message || '');
      const code = e?.code;
      if (code === 'P2022' || /column.*User\.(email|phone)/i.test(msg)) {
        user = await this.prisma.user.findFirst({ where: { login: ident } as any });
      } else {
        this.log.error('Login error (query)', msg);
        throw e;
      }
    }

    if (!user) throw new UnauthorizedException('invalid_credentials');

    const hash: string | null = (user as any).passwordHash ?? (user as any).password ?? (user as any).hash ?? null;
    if (!hash) throw new UnauthorizedException('invalid_credentials');

    const ok = await argon2.verify(hash, password);
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
