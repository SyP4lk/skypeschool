// PATCH: 2025-09-28

// Вставьте фрагменты внутрь существующего TeachersController:
// 1) Обновите saveUpload, чтобы сохранять в server/uploads/teachers и проверять тип/размер.
private async saveUpload(file?: Express.Multer.File): Promise<string | null> {
  if (!file) return null;
  const MAX = 2 * 1024 * 1024; // 2 MB
  if (file.size && file.size > MAX) throw new Error('Файл слишком большой (до 2 МБ)');
  const allowed = ['image/jpeg','image/jpg','image/png','image/webp'];
  if (file.mimetype && !allowed.includes(file.mimetype)) throw new Error('Недопустимый тип файла');
  const fs = await import('fs/promises');
  const path = await import('path');
  const { randomUUID } = await import('crypto');
  const uploadDir = path.join(process.cwd(), 'uploads', 'teachers');
  await fs.mkdir(uploadDir, { recursive: true });
  const orig = (file.originalname || '').toLowerCase();
  const ext = path.extname(orig) || '.jpg';
  const safe = randomUUID() + ext;
  await fs.writeFile(path.join(uploadDir, safe), file.buffer);
  return `/uploads/teachers/${safe}`;
}
