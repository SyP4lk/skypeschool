import { Body, Controller, Get, Post } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

type Payload = { name?: string; email?: string; phone?: string; message: string };

@Controller('support')
export class SupportPublicController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  async create(@Body() body: Payload) {
    const message = (body?.message || '').trim();
    if (!message) {
      return { ok: false, message: 'message required' };
    }

    const fromLogin =
      (body as any)?.fromLogin ??
      (body?.name || null);

    const contact =
      body?.email?.trim() ||
      body?.phone?.trim() ||
      null;

    const row = await (this.prisma as any).supportMessage.create({
      data: {
        fromLogin: fromLogin || null,
        contact,
        message,
        // статус по умолчанию new — в схеме уже так
      },
    });

    return { ok: true, id: row.id };
  }

  @Get('status')
  status() {
    return { ok: true };
  }
}
