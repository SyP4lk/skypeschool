# SkypeSchool — Фронт ЛК и финансы (патч)
Дата: 2025-09-05

## Установка
1) Распаковать содержимое архива в папку `client/` проекта (с сохранением путей).
2) В `client/.env.local` указать:
```
NEXT_PUBLIC_API_URL=http://localhost:4000
```
3) Запуск: `cd client && npm i && npm run dev`.

## Содержимое
- lib/api.ts
- components/ui/Empty.tsx
- components/ui/Pagination.tsx
- app/register/page.tsx
- app/lk/student/page.tsx
- app/lk/teacher/page.tsx
- app/admin/finance/page.tsx
- app/admin/people/page.tsx
