import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async get(key: string) {
    const row = await this.prisma.setting.findUnique({ where: { key } });
    return { key, value: row?.value ?? '' };
  }

  async set(key: string, value: string) {
    await this.prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } });
    return { ok: true };
  }
}
