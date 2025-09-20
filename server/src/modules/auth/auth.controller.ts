import {
  Body, Controller, Get, Post, Req, Res, UnauthorizedException, BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { JwtService } from '@nestjs/jwt';
import { Response, Request } from 'express';
import * as argon2 from 'argon2';
import * as bcrypt from 'bcryptjs';
import { isP2021, isP2022 } from '../../common/prisma.util';

type LoginBody = {
  identifier?: string; // login | email | phone
  login?: string;
  email?: string;
  username?: string;
  phone?: string;
  password: string;
};

type RegisterBody = {
  login?: string;
  email?: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  messenger?: string; // "telegram:@nick" / "whatsapp:+7900..."
};

@Controller('auth')
export class AuthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  @Post('login')
  async login(@Body() body: LoginBody, @Res({ passthrough: true }) res: Response) {
    const identifierRaw =
      body.identifier ?? body.login ?? body.email ?? body.username ?? body.phone ?? '';
    const identifier = String(identifierRaw).trim();
    const password = String(body.password || '');

    if (!identifier || !password) {
      throw new BadRequestException('identifier_and_password_required');
    }

    const user = await this.findUserByIdentifierSafe(identifier);
    if (!user?.passwordHash) throw new UnauthorizedException('invalid_credentials');

    const hash: string = user.passwordHash;
    let ok = false;
    try {
      if (/^\$2[aby]\$/.test(hash)) {
        ok = await bcrypt.compare(password, hash);
      } else {
        ok = await argon2.verify(hash, password);
      }
    } catch {
      ok = false;
    }
    if (!ok) throw new UnauthorizedException('invalid_credentials');

    const token = await this.jwt.signAsync({ sub: user.id, role: user.role }, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      secret: process.env.JWT_SECRET!,
    });

    this.setAuthCookie(res, token);
    return { ok: true, user: this.publicUser(user) };
  }

  @Post('register')
  async register(@Body() body: RegisterBody, @Res({ passthrough: true }) res: Response) {
    const firstName = (body.firstName || '').trim();
    const lastName = (body.lastName || '').trim();
    const phoneDigits = String(body.phone || '').replace(/\D+/g, '');
    const password = String(body.password || '');
    if (!firstName || !lastName || !phoneDigits || !password) {
      throw new BadRequestException('required_fields_missing');
    }

    const login = (body.login || body.email || `student_${Date.now()}`).trim();
    const email = (body.email || '').trim().toLowerCase();
    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

    let user: any;
    try {
      // Собираем createData в any, чтобы не споткнуться об отсутствующие колонки на типах
      const createData: any = {
        login,
        passwordHash,
        firstName,
        lastName,
        role: 'student',
      };
      if (email) createData.email = email;
      // ниже — мягкие поля: если колонок нет, БД/Prisma вернут P2022/P2021, но TS не должен падать
      createData.balance = 0;
      createData.phone = phoneDigits;
      if (body.messenger) createData.messenger = body.messenger;

      user = await this.prisma.user.create({ data: createData as any });
    } catch (e) {
      if (isP2022(e) || isP2021(e)) {
        // fallback: минимальный create
        user = await this.prisma.user.create({
          data: {
            login,
            passwordHash,
            firstName,
            lastName,
            role: 'student',
          },
        });
        // дозапись одним апдейтом, data через any
        const updateData: any = {};
        if (email) updateData.email = email;
        updateData.balance = 0;
        updateData.phone = phoneDigits;
        if (body.messenger) updateData.messenger = body.messenger;
        try { await this.prisma.user.update({ where: { id: user.id }, data: updateData as any }); } catch {}
      } else {
        throw e;
      }
    }

    const token = await this.jwt.signAsync({ sub: user.id, role: user.role }, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      secret: process.env.JWT_SECRET!,
    });
    this.setAuthCookie(res, token);
    return { ok: true, user: this.publicUser(user) };
  }

  @Get('me')
  async me(@Req() req: Request) {
    const auth = (req as any)['auth'] as { userId?: string } | undefined;
    const userId = auth?.userId;
    if (!userId) {
      const token =
        ((req as any).cookies && (((req as any).cookies['token']) || ((req as any).cookies['auth_token']))) || null;
      if (!token) throw new UnauthorizedException();
      try {
        const payload = await this.jwt.verifyAsync(token, { secret: process.env.JWT_SECRET! });
        const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
        if (!user) throw new UnauthorizedException();
        return this.publicUser(user);
      } catch {
        throw new UnauthorizedException();
      }
    }
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    return this.publicUser(user);
  }

  private setAuthCookie(res: Response, token: string) {
    const isProd = (process.env.NODE_ENV || '').toLowerCase() === 'production';
    res.cookie('token', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      path: '/',
      maxAge: 7 * 24 * 3600 * 1000,
    });
  }

  private publicUser(u: any) {
    const { passwordHash, ...rest } = u || {};
    return rest;
  }

  private async findUserByIdentifierSafe(identifier: string) {
    try {
      const u = await this.prisma.user.findFirst({ where: { login: identifier } });
      if (u) return u;
    } catch {}

    if (identifier.includes('@')) {
      try {
        const u = await this.prisma.user.findFirst({ where: { email: identifier as any } });
        if (u) return u;
      } catch (e) { if (!(isP2022(e) || isP2021(e))) throw e; }
    }

    const digits = identifier.replace(/\D+/g, '');
    if (digits.length >= 6) {
      try {
        const u = await this.prisma.user.findFirst({ where: { phone: digits as any } });
        if (u) return u;
      } catch (e) { if (!(isP2022(e) || isP2021(e))) throw e; }
    }

    try { return await this.prisma.user.findFirst({ where: { login: identifier } }); } catch { return null; }
  }
}
