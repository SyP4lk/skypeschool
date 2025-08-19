import { Injectable, Logger } from '@nestjs/common';
// Вкл. почту при деплое (nodemailer) — зависимость подключим позже
// import * as nodemailer from 'nodemailer';

@Injectable()
export class TrialRequestsService {
  private readonly logger = new Logger('TrialRequests');

  private emailEnabled() {
    return (process.env.ENABLE_EMAIL || '') === '1';
  }

  async accept(payload: { name: string; phone?: string; email?: string; message?: string }) {
    if (!this.emailEnabled()) {
      this.logger.log('TRIAL_REQUEST (noop): ' + JSON.stringify({ ...payload, at: new Date().toISOString() }));
      return { ok: true, mode: 'noop' as const };
    }
    // Прод-режим: включим отправку при деплое
    // const transporter = nodemailer.createTransport({
    //   host: process.env.SMTP_HOST,
    //   port: Number(process.env.SMTP_PORT || 587),
    //   secure: false,
    //   auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    // });
    // await transporter.sendMail({
    //   from: process.env.SMTP_USER,
    //   to: process.env.NOTIFY_EMAIL_TO,
    //   subject: `Новая заявка на пробный урок — ${payload.name}`,
    //   text: [
    //     `Имя: ${payload.name}`,
    //     `Телефон: ${payload.phone || '-'}`,
    //     `Email: ${payload.email || '-'}`,
    //     '',
    //     'Сообщение:',
    //     payload.message || '-',
    //   ].join('\n'),
    // });
    return { ok: true, mode: 'email' as const };
  }

  status() {
    return { emailEnabled: this.emailEnabled() };
  }
}
