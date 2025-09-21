import {
  Controller, Get, Post, Put, Delete,
  Param, Body, BadRequestException, NotFoundException, UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { PrismaService } from '../../prisma.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/teachers')
export class AdminTeachersController {
  constructor(private readonly prisma: PrismaService) {}

  private async resolveIds(id: string): Promise<{ userId: string|null; profileId: string|null }> {
    const p: any = this.prisma as any;
    const u = await p.user.findUnique?.({ where: { id }, select: { id: true } });
    if (u?.id) {
      const prof = await p.teacherProfile?.findUnique?.({ where: { userId: u.id }, select: { id: true, userId: true } });
      return { userId: u.id, profileId: prof?.id ?? null };
    }
    const prof2 = await p.teacherProfile?.findUnique?.({ where: { id }, select: { id: true, userId: true } });
    if (prof2?.id) return { userId: prof2.userId, profileId: prof2.id };
    return { userId: null, profileId: null };
  }

  @Get()
  async list() {
    const p: any = this.prisma as any;
    try {
      if (p.teacherProfile?.findMany) {
        const rows = await p.teacherProfile.findMany({
          include: { user: { select: { id: true, login: true, firstName: true, lastName: true, role: true } } },
        });
        if (rows?.length) return rows.map((r: any) => ({ id: r.id, userId: r.userId ?? r.user?.id, user: r.user }));
      }
    } catch {}
    try {
      if (p.teacherSubject?.findMany) {
        const rows = await p.teacherSubject.findMany({
          include: { teacher: { select: { id: true, login: true, firstName: true, lastName: true, role: true } } },
        });
        const seen = new Set<string>();
        const items = rows
          .filter((r: any) => { const k = r.teacherId || r.teacher?.id; if (!k || seen.has(k)) return false; seen.add(k); return true; })
          .map((r: any) => ({ id: r.teacherId || r.teacher?.id, userId: r.teacherId || r.teacher?.id, user: r.teacher }));
        if (items.length) return items;
      }
    } catch {}
    const users = await this.prisma.user.findMany({
      where: { role: 'teacher' } as any,
      select: { id: true, login: true, firstName: true, lastName: true, role: true } as any,
      orderBy: { createdAt: 'desc' }, take: 200,
    });
    return users.map((u: any) => ({ id: u.id, userId: u.id, user: u }));
  }

  @Post()
  async create(@Body() body: any) {
    const p: any = this.prisma as any;
    const userId = String(body?.userId || '').trim();
    if (!userId) throw new BadRequestException('userId_required');

    const user = await p.user.findUnique({ where: { id: userId }, select: { id: true, role: true } });
    if (!user) throw new BadRequestException('user_not_found');

    try { await p.user.update({ where: { id: userId }, data: { role: 'teacher' } }); } catch {}

    let prof: any = null;
    try {
      if (p.teacherProfile?.upsert) {
        prof = await p.teacherProfile.upsert({ where: { userId }, create: { userId }, update: {}, select: { id: true, userId: true } });
      } else if (p.teacherProfile?.findUnique || p.teacherProfile?.create) {
        const old = await p.teacherProfile?.findUnique?.({ where: { userId }, select: { id: true, userId: true } });
        prof = old || (await p.teacherProfile?.create?.({ data: { userId }, select: { id: true, userId: true } }));
      }
    } catch {}
    return { ok: true, id: prof?.id ?? null, userId };
  }

  @Get(':id')
  async read(@Param('id') id: string) {
    const p: any = this.prisma as any;
    const ids = await this.resolveIds(id);
    const userId = ids.userId || id;

    const user = await p.user.findUnique({
      where: { id: userId },
      select: {
        id: true, login: true, role: true,
        firstName: true, lastName: true, email: true, phone: true,
        balance: true, createdAt: true, teacherProfile: true,
      },
    });
    if (!user) throw new NotFoundException('teacher_not_found');

    let teacherSubjects: any[] = [];
    try {
      if (p.teacherSubject?.findMany) {
        const rows = await p.teacherSubject.findMany({
          where: { teacherId: (await this.resolveIds(id)).profileId || id },
          include: { subject: true },
        });
        teacherSubjects = rows.map((r: any) => ({
          subjectId: r.subjectId ?? r.subject?.id,
          subjectName: r.subject?.name,
          price: Number(r.price ?? 0),
          duration: Number(r.duration ?? r.durationMin ?? 60),
        }));
      } else {
        const prof = user.teacherProfile || (await p.teacherProfile?.findUnique?.({
          where: { userId },
          include: { subjects: { include: { subject: true } } },
        }));
        const list = prof?.subjects ?? [];
        teacherSubjects = list.map((r: any) => ({
          subjectId: r.subjectId ?? r.subject?.id,
          subjectName: r.subject?.name,
          price: Number(r.price ?? 0),
          duration: Number(r.duration ?? r.durationMin ?? 60),
        }));
      }
    } catch { teacherSubjects = []; }

    return {
      user: {
        id: user.id, login: user.login, role: user.role,
        firstName: user.firstName, lastName: user.lastName,
        email: user.email, phone: user.phone,
        balance: user.balance, createdAt: user.createdAt,
      },
      aboutShort: user.teacherProfile?.aboutShort ?? null,
      photo: user.teacherProfile?.photo ?? null,
      teacherSubjects,
      contactVk: user.teacherProfile?.contactVk ?? null,
      contactTelegram: user.teacherProfile?.contactTelegram ?? null,
      contactWhatsapp: user.teacherProfile?.contactWhatsapp ?? null,
      contactZoom: user.teacherProfile?.contactZoom ?? null,
      contactTeams: user.teacherProfile?.contactTeams ?? null,
      contactDiscord: user.teacherProfile?.contactDiscord ?? null,
      contactMax: user.teacherProfile?.contactMax ?? null,
    };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    const p: any = this.prisma as any;
    const ids = await this.resolveIds(id);
    const userId = ids.userId || id;
    let profileId = ids.profileId;

    const dataUser: any = {};
    if (body?.firstName !== undefined) dataUser.firstName = String(body.firstName || '');
    if (body?.lastName  !== undefined) dataUser.lastName  = String(body.lastName  || '');
    if (body?.email     !== undefined) dataUser.email     = String(body.email     || '');
    if (body?.phone     !== undefined) dataUser.phone     = String(body.phone     || '');
    if (Object.keys(dataUser).length && userId) {
      await p.user.update({ where: { id: userId }, data: dataUser });
    }

    const profileData: any = {};
    if (body?.aboutShort !== undefined) profileData.aboutShort = String(body.aboutShort || '');
    const contacts: any = {};
    for (const k of ['contactVk','contactTelegram','contactWhatsapp','contactZoom','contactTeams','contactDiscord','contactMax']) {
      if (Object.prototype.hasOwnProperty.call(body, k)) contacts[k] = body[k] || null;
    }
    try {
      if (p.teacherProfile?.upsert) {
        const prof = await p.teacherProfile.upsert({
          where: { userId }, create: { userId, ...profileData, ...contacts },
          update: { ...profileData, ...contacts }, select: { id: true },
        });
        profileId = prof?.id || profileId;
      } else {
        const exists = await p.teacherProfile?.findUnique?.({ where: { userId }, select: { id: true } });
        if (exists?.id && p.teacherProfile?.update) {
          await p.teacherProfile.update({ where: { userId }, data: { ...profileData, ...contacts } });
          profileId = exists.id;
        } else if (p.teacherProfile?.create) {
          const created = await p.teacherProfile.create({ data: { userId, ...profileData, ...contacts }, select: { id: true } });
          profileId = created?.id || profileId;
        }
      }
    } catch {}

    if (body?.teacherSubjects !== undefined) {
      let arr: any[] = [];
      if (Array.isArray(body.teacherSubjects)) arr = body.teacherSubjects;
      else { try { arr = JSON.parse(body.teacherSubjects); } catch { arr = []; } }

      if (profileId && p.teacherSubject?.deleteMany && p.teacherSubject?.createMany) {
        await p.teacherSubject.deleteMany({ where: { teacherId: profileId } });
        const unique = new Map<string, any>();
        for (const r of arr) {
          const sid = String(r?.subjectId ?? '').trim();
          if (!sid || unique.has(sid)) continue;
          unique.set(sid, {
            teacherId: profileId,
            subjectId: sid,
            price: Number(r?.price ?? 0),
            duration: Number(r?.duration ?? r?.durationMin ?? 60),
          });
        }
        const data = [...unique.values()];
        if (data.length) await p.teacherSubject.createMany({ data });
      } else if (p.teacherProfile?.update) {
        const normalized = arr
          .map((r: any) => ({
            subjectId: String(r?.subjectId ?? '').trim(),
            price: Number(r?.price ?? 0),
            duration: Number(r?.duration ?? r?.durationMin ?? 60),
          }))
          .filter((r: any) => !!r.subjectId);
        try { await p.teacherProfile.update({ where: { userId }, data: { subjects: normalized } }); } catch {}
      }
    }
    return { ok: true };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const p: any = this.prisma as any;
    const { userId, profileId } = await this.resolveIds(id);
    const targetUserId = userId || id;

    const u = await p.user.findUnique({ where: { id: targetUserId }, select: { login: true } });
    if (!u) throw new BadRequestException('teacher_not_found');

    const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    await p.user.update({
      where: { id: targetUserId },
      data: { login: `${u.login}__deleted__${stamp}`.slice(0, 150) },
    });

    if (profileId) {
      try { await p.teacherSubject?.deleteMany?.({ where: { teacherId: profileId } }); } catch {}
      try { await p.teacherProfile?.delete?.({ where: { id: profileId } }); } catch {}
    } else {
      try { await p.teacherProfile?.delete?.({ where: { userId: targetUserId } }); } catch {}
    }

    return { ok: true };
  }
}
