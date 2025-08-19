// server/src/common/mailer/mailer.service.ts
import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import { request } from 'undici';

type TrialPayload = {
  name: string;
  email: string;
  phone: string;
  subject?: string;
  messenger?: string;
  comment?: string;
  teacherId?: string;
};

const env = (k: string, d = '') => process.env[k] ?? d;

// Общие ENV
const NODE_ENV        = env('NODE_ENV', 'development');
const MAIL_PROVIDER   = env('MAIL_PROVIDER', 'smtp'); // smtp | brevo | dummy
const ADMIN_EMAIL     = env('ADMIN_EMAIL', '');
const SMTP_FROM_FALLB = 'no-reply@localhost';

// SMTP ENV
const SMTP_HOST          = env('SMTP_HOST', '');
const SMTP_PORT          = Number(env('SMTP_PORT', '25'));
const SMTP_USER          = env('SMTP_USER', '');
const SMTP_PASS          = env('SMTP_PASS', '');
const SMTP_FROM          = env('SMTP_FROM', SMTP_USER || SMTP_FROM_FALLB);
const SMTP_TLS_INSECURE  = env('SMTP_TLS_INSECURE', '0') === '1'; // только для локальной отладки!

// Brevo ENV
const BREVO_API_KEY   = env('BREVO_API_KEY', '');
const BREVO_SENDER    = env('BREVO_SENDER', SMTP_FROM);

/**
 * Сервис отправки почты.
 * Провайдер выбирается переменной MAIL_PROVIDER: smtp | brevo | dummy
 */
@Injectable()
export class MailerService {
  private readonly log = new Logger('Mailer');

  /**
   * Отправка письма по заявке «Пробный урок».
   */
  async sendTrialEmail(p: TrialPayload): Promise<void> {
    const text = this.buildTrialText(p);
    const to = ADMIN_EMAIL || BREVO_SENDER || SMTP_FROM;

    this.log.verbose(
      `[begin] provider=${MAIL_PROVIDER} to=${to} from=${SMTP_FROM} ` +
      `(smtp: host=${SMTP_HOST} port=${SMTP_PORT} insecureTLS=${SMTP_TLS_INSECURE})`
    );

    try {
      switch (MAIL_PROVIDER) {
        case 'brevo':
          await this.sendViaBrevo({ to, subject: 'Заявка на пробный урок', text });
          break;
        case 'smtp':
          await this.sendViaSmtp({ to, subject: 'Заявка на пробный урок', text });
          break;
        case 'dummy':
          // Для локальной изоляции: считаем, что всё ок, только логируем.
          this.log.warn('[dummy] Почта не отправляется, режим dummy включён');
          break;
        default:
          throw new Error(`Unknown MAIL_PROVIDER: ${MAIL_PROVIDER}`);
      }
      this.log.log('[done] sent ok');
    } catch (e: any) {
      const msg = e?.message || String(e);
      this.log.error(`[fail] send error: ${msg}`);

      // В DEV отдаём понятный текст наверх, чтобы фронт/постман сразу показали причину.
      if (NODE_ENV !== 'production') {
        throw new Error('MAIL_ERROR: ' + msg);
      }
      throw e;
    }
  }

  // ======== helpers ========

  private buildTrialText(p: TrialPayload): string {
    return [
      'Новая заявка на пробный урок',
      `Имя: ${p.name}`,
      `E-mail: ${p.email}`,
      `Телефон: ${p.phone}`,
      p.subject   ? `Предмет: ${p.subject}`       : '',
      p.messenger ? `Мессенджер: ${p.messenger}` : '',
      p.teacherId ? `TeacherId: ${p.teacherId}`  : '',
      p.comment   ? `Комментарий: ${p.comment}`  : '',
    ].filter(Boolean).join('\n');
  }

  private async sendViaSmtp(opts: { to: string; subject: string; text: string }) {
    if (!SMTP_HOST) throw new Error('SMTP_HOST is empty');
    if (!opts.to)   throw new Error('ADMIN_EMAIL (or fallback) is empty');

    // ВАЖНО: используем SMTPTransport.Options — тогда свойства host/port/secure валидны.
    const transportOptions: SMTPTransport.Options = {
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465, // 465 = SMTPS, иначе STARTTLS
      auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
      // На локальной отладке иногда нужен "мягкий" TLS. В проде выключить!
      ...(SMTP_TLS_INSECURE ? { tls: { rejectUnauthorized: false } } : {}),
    };

    const tr = nodemailer.createTransport(transportOptions);
    await tr.sendMail({
      from: SMTP_FROM,
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
    });
  }

  private async sendViaBrevo(opts: { to: string; subject: string; text: string }) {
    if (!BREVO_API_KEY) throw new Error('BREVO_API_KEY is empty');
    if (!opts.to)       throw new Error('ADMIN_EMAIL (or fallback) is empty');

    const res = await request('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json',
        'accept': 'application/json',
      },
      body: JSON.stringify({
        sender: { email: BREVO_SENDER },
        to: [{ email: opts.to }],
        subject: opts.subject,
        textContent: opts.text,
      }),
    });

    if (res.statusCode >= 300) {
      const body = await res.body.text();
      throw new Error(`Brevo error ${res.statusCode}: ${body}`);
    }
  }
}
