# Server patch (SkypeSchool)

## Added files
- `src/modules/teachers/teacher-me.controller.ts` — эндпоинты ЛК преподавателя:
  - GET `/api/teacher/me/subjects`
  - GET `/api/teacher/me/students?q=`
  - POST `/api/teacher/me/lessons`
  - PATCH `/api/teacher/me/lessons/:id/done`
  - PATCH `/api/teacher/me/lessons/:id/cancel`
- `src/modules/finance/finance-me.controller.ts` — баланс/транзакции текущего пользователя:
  - GET `/api/finance/me/balance`
  - GET `/api/finance/me/transactions`
- `src/modules/admin/students.controller.ts` — обновлённая версия: не затирает имя/фамилию, аккуратный upsert профиля.

## Подключение в модули
Добавьте контроллеры в соответствующие модули (имена могут отличаться):

**teachers.module.ts**
```ts
import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { TeacherMeController } from './teacher-me.controller';
import { AdminTeachersController } from './admin-teachers.controller'; // если есть

@Module({
  controllers: [TeacherMeController, AdminTeachersController],
  providers: [PrismaService],
})
export class TeachersModule {}
```

**finance.module.ts**
```ts
import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { FinanceMeController } from './finance-me.controller';

@Module({
  controllers: [FinanceMeController],
  providers: [PrismaService],
})
export class FinanceModule {}
```

Если у вас другой модульный разрез — просто импортируйте контроллеры в актуальные модули приложения.

## Команды
```bash
cd server
npm i
npx prisma generate
npm run start:dev
```
