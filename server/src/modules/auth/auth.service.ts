import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { normalizePhone } from './phone.util';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  private async tryFindByLogin(login: string) {
    try { return await this.prisma.user.findUnique({ where: { login } }); }
    catch (e: any) { if (e?.code === 'P2022') return null; throw e; }
  }
  private async tryFindByEmail(email: string) {
    try { return await this.prisma.user.findUnique({ where: { email } }); }
    catch (e: any) { if (e?.code === 'P2022') return null; throw e; }
  }
  private async tryFindByPhone(phone: string) {
    try { return await this.prisma.user.findUnique({ where: { phone } }); }
    catch (e: any) { if (e?.code === 'P2022') return null; throw e; }
  }

  async validateUser(ident: string, password: string) {
    const id = (ident || '').trim().toLowerCase();

    let user = await this.tryFindByLogin(id);
    if (!user && id.includes('@')) user = await this.tryFindByEmail(id);
    if (!user) {
      const phone = normalizePhone(ident);
      if (phone) user = await this.tryFindByPhone(phone);
    }

    if (!user) throw new UnauthorizedException('Invalid credentials');
    const ok = await argon2.verify(user.passwordHash, password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    return user;
  }

  async sign(payload: { id: string; login: string; role: string }) {
    return this.jwt.signAsync({ sub: payload.id, login: payload.login, role: payload.role });
  }

  async me(userId: string) {
    const base = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, login: true, role: true, firstName: true, lastName: true, createdAt: true },
    });

    let email: string | null = null, phone: string | null = null;
    try {
      const ext = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, phone: true } as any,
      });
      if (ext) { email = (ext as any).email ?? null; phone = (ext as any).phone ?? null; }
    } catch { /* колонок может не быть — ок */ }

    return { user: { ...base, email, phone } };
  }
}
