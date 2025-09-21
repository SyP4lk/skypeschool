import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { PrismaService } from '../../prisma.service';

type AnyRec = Record<string, any>;

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/settings')
export class AdminSettingsController {
  constructor(private readonly prisma: PrismaService) {}

  /** GET /api/admin/settings?key=payment_instructions */
  @Get()
  async read(@Query('key') key = '') {
    const k = String(key || '').trim();
    if (!k) return { key: k, value: '' };
    const p: AnyRec = this.prisma as any;

    const tryFind = async (): Promise<string| null> => {
      try {
        // try `setting`
        const one = await p.setting?.findUnique?.({ where: { key: k }, select: { value: true } });
        if (one?.value !== undefined) return String(one.value ?? '');
      } catch {}
      try {
        const one = await p.appSetting?.findUnique?.({ where: { key: k }, select: { value: true } });
        if (one?.value !== undefined) return String(one.value ?? '');
      } catch {}
      try {
        const one = await p.systemSetting?.findUnique?.({ where: { key: k }, select: { value: true } });
        if (one?.value !== undefined) return String(one.value ?? '');
      } catch {}
      return null;
    };

    const val = await tryFind();
    return { key: k, value: val ?? '' };
  }

  /** POST /api/admin/settings { key, value } */
  @Post()
  async write(@Body() body: any) {
    const key = String(body?.key || '').trim();
    const value = String(body?.value ?? '');
    if (!key) return { ok: false };

    const p: AnyRec = this.prisma as any;
    const tryUpsert = async () => {
      try {
        if (p.setting?.upsert) {
          await p.setting.upsert({ where: { key }, create: { key, value }, update: { value } });
          return true;
        }
      } catch {}
      try {
        if (p.appSetting?.upsert) {
          await p.appSetting.upsert({ where: { key }, create: { key, value }, update: { value } });
          return true;
        }
      } catch {}
      try {
        if (p.systemSetting?.upsert) {
          await p.systemSetting.upsert({ where: { key }, create: { key, value }, update: { value } });
          return true;
        }
      } catch {}
      return false;
    };
    const ok = await tryUpsert();
    return { ok };
  }
}
