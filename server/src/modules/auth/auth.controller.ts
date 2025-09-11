import {
  Controller, Post, Get, Body, Res, Req,
  UnauthorizedException
} from '@nestjs/common';
import { Response, Request } from 'express';
import { PrismaService } from '../../prisma.service';
import { JwtService } from '@nestjs/jwt';
import { verifyPassword } from './password.util';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  @Post('login')
  async login(@Body() body: any, @Res({ passthrough: true }) res: Response) {
    const login = String(body?.login ?? '').trim();
    const password = String(body?.password ?? '');

    if (!login || !password) {
      throw new UnauthorizedException('invalid_credentials');
    }

    try {
      // Ищем по login/email/phone
      const user = await this.prisma.user.findFirst({
        where: { OR: [{ login }, { email: login }, { phone: login }] },
      });
      if (!user) throw new UnauthorizedException('invalid_credentials');

      // Подхватываем «дрейф» имен поля хеша
      const hash: string | null =
        (user as any).passwordHash ?? (user as any).password ?? (user as any).hash ?? null;

      const ok = await verifyPassword(password, hash);
      if (!ok) throw new UnauthorizedException('invalid_credentials');

      const token = await this.jwt.signAsync(
        { sub: user.id, role: (user as any).role },
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d', secret: process.env.JWT_SECRET }
      );

      // cookie
      res.cookie('token', token, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      });

      // «тонкий» ответ пользователем
      return {
        id: user.id,
        login: (user as any).login,
        role:  (user as any).role,
        email: (user as any).email ?? null,
        phone: (user as any).phone ?? null,
        firstName: (user as any).firstName ?? null,
        lastName:  (user as any).lastName ?? null,
        balance:   (user as any).balance ?? 0,
        createdAt: (user as any).createdAt,
      };
    } catch (e) {
      // Вместо 500 — всегда 401 для неверных учёток/сравнения
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
    const token = (req as any)?.cookies?.token;
    if (!token) throw new UnauthorizedException('unauthorized');

    try {
      const payload = await this.jwt.verifyAsync(token, { secret: process.env.JWT_SECRET });
      const user = await this.prisma.user.findUnique({ where: { id: payload?.sub } });
      if (!user) throw new UnauthorizedException('unauthorized');
      return {
        id: user.id,
        login: (user as any).login,
        role:  (user as any).role,
        email: (user as any).email ?? null,
        phone: (user as any).phone ?? null,
        firstName: (user as any).firstName ?? null,
        lastName:  (user as any).lastName ?? null,
        balance:   (user as any).balance ?? 0,
        createdAt: (user as any).createdAt,
      };
    } catch {
      throw new UnauthorizedException('unauthorized');
    }
  }
}
