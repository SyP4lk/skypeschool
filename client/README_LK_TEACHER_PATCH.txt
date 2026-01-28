# Client patch (Teacher LK)

## Added files
- `app/lk/teacher/_lib/api.ts` — тонкий wrapper для /api
- `app/lk/teacher/_components/Balance.tsx` — карточка баланса (нормализует NaN)
- `app/lk/teacher/_components/CreateLessonForm.tsx` — форма назначения урока, использует новые ручки:
  - GET `/api/teacher/me/subjects`
  - GET `/api/teacher/me/students?q=`
  - POST `/api/teacher/me/lessons`
- `app/lk/teacher/page.tsx` — пример страницы ЛК преподавателя.

Если у вас уже есть готовые страницы — используйте компоненты как ориентир и перенесите вызовы API:
 - поиск учеников → `/api/teacher/me/students`
 - предметы → `/api/teacher/me/subjects`
 - создание урока → `/api/teacher/me/lessons` (JSON)

Деньги форматируются через `Intl.NumberFormat('ru-RU',{style:'currency',currency:'RUB'})`.
