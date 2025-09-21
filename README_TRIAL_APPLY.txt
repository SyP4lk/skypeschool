Trial Requests — sink-mode patch (email off until deploy)

API
---
POST /api/trial-requests  → { ok: true, mode: 'noop' | 'email' }
GET  /api/trial-requests/status → { emailEnabled: boolean }

Как применить
-------------
1) Скопируйте server/src/modules/trial-requests/** в проект.
2) Включите модуль в AppModule:
   import { TrialRequestsModule } from './modules/trial-requests/trial-requests.module';
   @Module({ imports: [ /* ... */, TrialRequestsModule ] })
3) ENV (server/.env):
   ENABLE_EMAIL=0
   NOTIFY_EMAIL_TO=
   SMTP_HOST=
   SMTP_PORT=587
   SMTP_USER=
   SMTP_PASS=
4) Перезапуск: npm run start:dev
