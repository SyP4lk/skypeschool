"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailerService = void 0;
const common_1 = require("@nestjs/common");
const nodemailer = __importStar(require("nodemailer"));
const undici_1 = require("undici");
const env = (k, d = '') => process.env[k] ?? d;
const NODE_ENV = env('NODE_ENV', 'development');
const MAIL_PROVIDER = env('MAIL_PROVIDER', 'smtp');
const ADMIN_EMAIL = env('ADMIN_EMAIL', '');
const SMTP_FROM_FALLB = 'no-reply@localhost';
const SMTP_HOST = env('SMTP_HOST', '');
const SMTP_PORT = Number(env('SMTP_PORT', '25'));
const SMTP_USER = env('SMTP_USER', '');
const SMTP_PASS = env('SMTP_PASS', '');
const SMTP_FROM = env('SMTP_FROM', SMTP_USER || SMTP_FROM_FALLB);
const SMTP_TLS_INSECURE = env('SMTP_TLS_INSECURE', '0') === '1';
const BREVO_API_KEY = env('BREVO_API_KEY', '');
const BREVO_SENDER = env('BREVO_SENDER', SMTP_FROM);
let MailerService = class MailerService {
    log = new common_1.Logger('Mailer');
    async sendTrialEmail(p) {
        const text = this.buildTrialText(p);
        const to = ADMIN_EMAIL || BREVO_SENDER || SMTP_FROM;
        this.log.verbose(`[begin] provider=${MAIL_PROVIDER} to=${to} from=${SMTP_FROM} ` +
            `(smtp: host=${SMTP_HOST} port=${SMTP_PORT} insecureTLS=${SMTP_TLS_INSECURE})`);
        try {
            switch (MAIL_PROVIDER) {
                case 'brevo':
                    await this.sendViaBrevo({ to, subject: 'Заявка на пробный урок', text });
                    break;
                case 'smtp':
                    await this.sendViaSmtp({ to, subject: 'Заявка на пробный урок', text });
                    break;
                case 'dummy':
                    this.log.warn('[dummy] Почта не отправляется, режим dummy включён');
                    break;
                default:
                    throw new Error(`Unknown MAIL_PROVIDER: ${MAIL_PROVIDER}`);
            }
            this.log.log('[done] sent ok');
        }
        catch (e) {
            const msg = e?.message || String(e);
            this.log.error(`[fail] send error: ${msg}`);
            if (NODE_ENV !== 'production') {
                throw new Error('MAIL_ERROR: ' + msg);
            }
            throw e;
        }
    }
    buildTrialText(p) {
        return [
            'Новая заявка на пробный урок',
            `Имя: ${p.name}`,
            `E-mail: ${p.email}`,
            `Телефон: ${p.phone}`,
            p.subject ? `Предмет: ${p.subject}` : '',
            p.messenger ? `Мессенджер: ${p.messenger}` : '',
            p.teacherId ? `TeacherId: ${p.teacherId}` : '',
            p.comment ? `Комментарий: ${p.comment}` : '',
        ].filter(Boolean).join('\n');
    }
    async sendViaSmtp(opts) {
        if (!SMTP_HOST)
            throw new Error('SMTP_HOST is empty');
        if (!opts.to)
            throw new Error('ADMIN_EMAIL (or fallback) is empty');
        const transportOptions = {
            host: SMTP_HOST,
            port: SMTP_PORT,
            secure: SMTP_PORT === 465,
            auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
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
    async sendViaBrevo(opts) {
        if (!BREVO_API_KEY)
            throw new Error('BREVO_API_KEY is empty');
        if (!opts.to)
            throw new Error('ADMIN_EMAIL (or fallback) is empty');
        const res = await (0, undici_1.request)('https://api.brevo.com/v3/smtp/email', {
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
};
exports.MailerService = MailerService;
exports.MailerService = MailerService = __decorate([
    (0, common_1.Injectable)()
], MailerService);
//# sourceMappingURL=mailer.service.js.map