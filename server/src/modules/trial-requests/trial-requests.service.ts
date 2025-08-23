import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
// import * as nodemailer from 'nodemailer'; // включим позже при SMTP

@Injectable()
export class TrialRequestsService {
  private readonly logger = new Logger('TrialRequests');
  constructor(private readonly prisma: PrismaService) {}

  private emailEnabled() {
    return (process.env.ENABLE_EMAIL || '') === '1';
  }

  async accept(payload: {
    name: string;
    phone?: string;
    email?: string;
    subjectId?: string;
    message?: string;
  }) {
    // 1) Всегда пишем в БД
    await this.prisma.trialRequest.create({
      data: {
        name: payload.name,
        contact: payload.phone || payload.email || null,
        subjectId: payload.subjectId || null,
        message: payload.message || null,
      },
    });

    // 2) Отправка писем — позже
    if (!this.emailEnabled()) {
      this.logger.log(
        'TRIAL_REQUEST (noop): ' +
          JSON.stringify({ ...payload, at: new Date().toISOString() }),
      );
      return { ok: true, mode: 'noop' as const };
    }

    // TODO: SMTP
    return { ok: true, mode: 'email' as const };
  }

  // НУЖНО для контроллера: GET /trial-requests/status
  status() {
    return { ok: true, emailEnabled: this.emailEnabled() };
  }
}
