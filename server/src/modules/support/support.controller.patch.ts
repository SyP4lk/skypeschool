// PATCH: 2025-09-28

// Во время создания сообщения support.POST создаём threadId и фиксируем clientKey из body (если есть).
// Добавьте поля:
//   const clientKey = String((body as any)?.clientKey || '') || null;
//   const threadId = crypto.randomUUID();
// Сохранение:
//   await this.prisma.supportMessage.create({
//     data: {
//       fromLogin: body?.name || null,
//       contact: body?.email || body?.phone || null,
//       message,
//       status: 'new',
//       role: 'user',
//       clientKey,
//       threadId,
//     },
//   });
// Вернуть клиенту threadId, чтобы он мог опрашивать /support/threads/:id/messages
