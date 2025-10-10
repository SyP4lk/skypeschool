// PATCH: 2025-09-28

Добавлен контроллер AdminFinanceProfitController (admin-profit.controller.ts).
Убедитесь, что он подключён в FinanceModule:
  import { AdminFinanceProfitController } from './admin-profit.controller';
  @Module({ controllers: [ ..., AdminFinanceProfitController ], providers: [...] })
Если у вас уже используется динамический импорт контроллеров — просто убедитесь,
что файл попадает в сборку и не попадает под ignore.
