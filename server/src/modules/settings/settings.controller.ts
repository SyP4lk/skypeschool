import { Body, Controller, Get, Post, Put, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { PrismaService } from '../../prisma.service';

type AnyRec = Record<string, any>;

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/settings')
export class SettingsController {
  constructor(private readonly prisma: PrismaService) {}

  private repo(p: AnyRec) {
    // tolerate different table names
    return (p as any).setting || (p as any).settings || (p as any).systemSetting || null;
  }

  /** GET /api/admin/settings?key=... -> { key, value } */
  @Get()
  async getOne(@Query('key') key?: string) {
    if (!key) throw new BadRequestException('key is required');
    const p: AnyRec = this.prisma as any;
    const repo = this.repo(p);
    if (!repo) return { key, value: '' };
    try {
      const row =
        (await repo.findUnique?.({ where: { key } })) ||
        (await repo.findFirst?.({ where: { key } }));
      return { key, value: row?.value ?? '' };
    } catch {
      return { key, value: '' };
    }
  }

  /** PUT /api/admin/settings  body { key, value }  (accepts POST too for backward compatibility) */
  @Put()
  @Post()
  async upsert(@Body() body: any) {
    const key = String(body?.key || '').trim();
    if (!key) throw new BadRequestException('key is required');
    const value = String(body?.value ?? '');

    const p: AnyRec = this.prisma as any;
    const repo = this.repo(p);
    if (!repo) return { ok: false };

    try {
      // Prefer dedicated upsert by key
      if (repo.upsert) {
        await repo.upsert({
          where: { key },
          update: { value },
          create: { key, value },
        });
        return { ok: true };
      }
    } catch {}

    // Fallback: find + update or create
    try {
      const old =
        (await repo.findUnique?.({ where: { key } })) ||
        (await repo.findFirst?.({ where: { key } }));
      if (old?.id && repo.update) {
        await repo.update({ where: { id: old.id }, data: { value } });
        return { ok: true };
      }
      if (repo.create) {
        await repo.create({ data: { key, value } });
        return { ok: true };
      }
    } catch {}

    return { ok: false };
  }
}
