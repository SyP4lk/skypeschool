SkypeSchool — Articles CRUD patch (fixed)

Что внутри
----------
1) server/src/modules/articles/admin-articles.controller.ts
   • GET :id, PATCH :id (multipart), DELETE :id
   • Загрузка картинок в server/public/uploads → доступны как /uploads/...
   • Защита: JwtAuthGuard + RolesGuard(admin)

2) server/src/modules/articles/articles.service.ts
   • findById, update, remove
   • Публичные ссылки (slug) не меняются при редактировании

3) client/app/admin/articles/page.tsx
   • Колонка «Действия»: Редактировать / Удалить

4) client/app/admin/articles/[id]/edit/page.tsx
   • Форма редактирования с заменой обложки

Как применить
-------------
1) Распакуйте файлы в корень репозитория (server/... и client/...). 
2) Убедитесь, что сервер отдаёт static из server/public (ServeStaticModule).
3) Запуск локально:
   cd server && npm i && npx prisma generate --schema ../prisma/schema.prisma && npm run start:dev
   cd ../client && npm i && npm run dev

Проверка
--------
• /admin/articles — появились «Редактировать» и «Удалить»
• Публичные: /interesnye-stati и /interesnye-stati/[slug]
