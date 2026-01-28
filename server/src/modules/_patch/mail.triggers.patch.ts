// PATCH: 2025-09-28

// Подключение писем к событиям:
// 1) В TrialRequestsService.accept(...) после записи в БД — вызвать mailer
//    (если ENABLE_EMAIL=1 и SMTP настроен).
//
//    constructor(private prisma: PrismaService, private mailer: MailerService) {}
//    await this.mailer.send({
//      to: process.env.MAIL_TO_ADMIN,
//      subject: 'Новая заявка на бесплатный урок',
//      text: `Имя: ${payload.name}\nКонтакт: ${payload.phone || payload.email}\nТекст: ${payload.message||''}`,
//    });
//
// 2) В RegisterController после создания пользователя role=student — письмо администратору.
//
// 3) В SupportPublicController.create(...) — письмо администратору о новом сообщении.
//
// .env (аддитивно):
// ENABLE_EMAIL=1
// SMTP_HOST=...
// SMTP_PORT=...
// SMTP_USER=...
// SMTP_PASS=...
// SMTP_SECURE=false
// MAIL_FROM="SkypeSchool <noreply@domain>"
// MAIL_TO_ADMIN=admin@domain
// APP_PUBLIC_URL=https://your-frontend.example
