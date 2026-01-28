Admin Guards Patch — secure admin endpoints

Что делает
----------
1) Защищает админские операции со статьями:
   server/src/modules/articles/admin-articles.controller.ts
   • Добавлены @UseGuards(JwtAuthGuard, RolesGuard) + @Roles('admin')
   • Полный CRUD (GET :id, POST, PATCH :id, DELETE :id)
   • Загрузка обложек → public/uploads (URL: /uploads/..)

2) Остальные админ-контроллеры уже под гардом (проверено):
   • server/src/modules/admin/admin.controller.ts
   • server/src/modules/admin/finance.controller.ts
   • server/src/modules/teachers/admin-teachers.controller.ts

Инварианты
----------
• Публичные API не менялись (GET /api/articles, GET /api/articles/:slug).
• Пути админ-эндпоинтов не переименованы.
• next/image не используется для /uploads (только обычный <img>).

Деплой на Render (шпаргалка)
----------------------------
Server (Nest):
  ENV:
    PRISMA_SCHEMA_PATH=../prisma/schema.prisma
    ALLOWED_ORIGINS=https://<client-host>
    ADMIN_INITIAL_PASSWORD=Admin12345!
    JWT_SECRET=<secure>
    NODE_ENV=production
  Build:
    npm ci && npx prisma generate --schema "$PRISMA_SCHEMA_PATH" && npm run build
  Start:
    npx prisma migrate deploy --schema "$PRISMA_SCHEMA_PATH" && node scripts/ensure-admin.cjs && node dist/main.js

Client (Next):
  ENV:
    NEXT_PUBLIC_API_URL=https://<server-host>/api

Проверка после деплоя
---------------------
• /api/admin/overview → 200 только с admin-cookie.
• /api/admin/articles (CRUD) → 401 без cookie, 403 без роли admin.
• /uploads/* отдаётся статикой (ServeStatic root 'public').
