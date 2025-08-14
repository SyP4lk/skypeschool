import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  async validateUser(login: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { login } });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const ok = await argon2.verify(user.passwordHash, password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    return user;
  }

  async sign(user: { id: string; login: string; role: string }) {
    const payload = { sub: user.id, login: user.login, role: user.role };
    return this.jwt.signAsync(payload);
  }

  async me(userId: string) {
    const { id, login, role, tz, balance, createdAt } = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    return { id, login, role, tz, balance, createdAt };
  }
}