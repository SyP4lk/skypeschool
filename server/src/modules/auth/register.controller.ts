import { Body, Controller, Post, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import * as bcrypt from 'bcryptjs';

type AnyRec = Record<string, any>;

@Controller('auth')
export class RegisterController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('register')
  async register(@Body() body: any) {
    const login = String(body?.login || '').trim();
    const password = String(body?.password || '').trim();
    const phone = String(body?.phone || '').trim();
    const email = String(body?.email || '').trim();

    if (!login || !password || !phone || !email) {
      throw new BadRequestException('Все поля обязательны: login, password, phone, email');
    }
    if (login.includes('__deleted__')) {
      throw new BadRequestException('Недопустимый логин');
    }

    const p: AnyRec = this.prisma as any;
    const exists = await p.user.findFirst({
      where: { OR: [
        { login: { equals: login, mode: 'insensitive' } },
        { email: { equals: email, mode: 'insensitive' } },
        { phone }
      ]},
      select: { id: true }
    });
    if (exists) throw new BadRequestException('Пользователь с такими данными уже существует');

    const hash = await bcrypt.hash(password, 10);
    const data: AnyRec = { login, phone, email, role: 'student', balance: 0 };

    data.passwordHash = hash;
    try { const u = await p.user.create({ data }); return { ok: true, id: u.id }; }
    catch {
      delete data.passwordHash; data.password = hash;
      const u = await p.user.create({ data }); return { ok: true, id: u.id };
    }
  }
}
