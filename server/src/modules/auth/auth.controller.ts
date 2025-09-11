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
      secure: isProd,
      sameSite: isProd ? ('none' as const) : ('lax' as const),
      path: '/',
      maxAge: 1000 * 60 * 60 * 24 * 7,
    };
  }

  @Post('login')
  async login(@Body() body: any, @Res({ passthrough: true }) res: Response) {
    try {
      const ident = String(
        body?.loginOrEmail ?? body?.login ?? body?.email ?? ''
      ).trim();
      const password = String(body?.password ?? body?.pass ?? '').trim();

      if (!ident || !password) throw new UnauthorizedException('invalid_credentials');

      // Пытаемся искать по login|email, а если в БД нет колонки email — откатываемся на login
      let user: any = null;
      try {
        user = await this.prisma.user.findFirst({
          where: { OR: [{ login: ident }, { email: ident }] },
        });
      } catch (e: any) {
        const code = e?.code;
        const msg = e?.message || '';
        if (code === 'P2022' || /User\.email/.test(msg)) {
          // колонки email нет в БД — ищем только по login
          user = await this.prisma.user.findFirst({ where: { login: ident } });
        } else {
          throw e;
        }
      }

      if (!user) throw new UnauthorizedException('invalid_credentials');

      const hash: string | null =
        user.passwordHash ?? user.password ?? user.hash ?? null;
      if (!hash) throw new UnauthorizedException('invalid_credentials');

      const ok = await argon2.verify(hash, password);
      if (!ok) throw new UnauthorizedException('invalid_credentials');

      const token = await this.jwt.signAsync(
        { sub: user.id, role: user.role, login: user.login },
        { secret: process.env.JWT_SECRET || 'dev', expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
      );

      res.cookie('token', token, this.cookieOpts());
      return { ok: true, id: user.id, role: user.role, login: user.login };
    } catch (e: any) {
      if (e instanceof UnauthorizedException) throw e;
      this.log.error('Login error', e?.stack || e?.message || String(e));
      // Для клиента отдаём единый ответ, без 500
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
          id: true, login: true, role: true,
          firstName: true, lastName: true,
          email: true, phone: true, balance: true, createdAt: true,
        },
      });
      if (!user) throw new UnauthorizedException('unauthorized');
      return user;
    } catch {
      throw new UnauthorizedException('unauthorized');
    }
  }
}
