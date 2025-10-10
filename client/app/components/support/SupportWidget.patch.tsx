// PATCH: 2025-09-28

// Добавьте в SupportWidget логику хранения threadId/clientKey и опроса ответов.
//
// При отправке первого сообщения:
//   - передавайте clientKey из localStorage (если нет — сгенерируйте и сохраните).
//   - сервер возвращает threadId — сохраните в localStorage ('support.threadId').
//
// Добавьте useEffect с setInterval(() => fetch(`/api/support/threads/${threadId}/messages?after=${lastTs}&clientKey=${clientKey}`), 7000)
// Ответы с role === 'admin' показывайте в другом стиле (у вас стили уже есть).
