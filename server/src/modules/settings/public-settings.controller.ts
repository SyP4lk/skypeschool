import { Controller, Get, Query } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

type AnyRec = Record<string, any>;

@Controller('settings/public')
export class PublicSettingsController {
  constructor(private readonly prisma: PrismaService) {}

  private repo(p: AnyRec) {
    return (p as any).setting || (p as any).settings || (p as any).systemSetting || null;
  }

  /** GET /api/settings/public?key=payment_instructions -> { value } */
  @Get()
  async get(@Query('key') key?: string) {
    const p: AnyRec = this.prisma as any;
    if (!key) return { value: '' };
    const repo = this.repo(p);
    try {
      const row =
        (await repo?.findUnique?.({ where: { key } })) ||
        (await repo?.findFirst?.({ where: { key } }));
      return { value: row?.value ?? '' };
    } catch {
      return { value: '' };
    }
  }
}
