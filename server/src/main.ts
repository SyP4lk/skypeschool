// PATCH: 2025-09-29 — cookie-parser + префикс /api, CORS, BigInt-fix
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';
import type { Request, Response, NextFunction } from 'express';
import * as express from 'express';
import { join } from 'path';

// cookie-parser через require — безопасно при любом tsconfig
// eslint-disable-next-line @typescript-eslint/no-var-requires
const cookieParser = require('cookie-parser');

function parseOrigins(raw: string | undefined): string[] {
  if (!raw) return ['http://localhost:3000', 'http://127.0.0.1:3000'];
  return String(raw)
    .split(',')
    .map((s: string) => s.trim())
    .filter(Boolean);
}

async function bootstrap() {
  // защита от повторного запуска (HMR/двойной импорт)
  if ((globalThis as any).__APP_LISTENING__) return;

  const app = await NestFactory.create(AppModule);

  // Глобальный префикс /api
  app.setGlobalPrefix('api');

  // CORS (фронт по умолчанию 3000)
  const origins = parseOrigins(process.env.ALLOWED_ORIGINS);
  app.enableCors({
    origin: origins,
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    // set-cookie всё равно недоступен из JS, но пусть будет явно
    exposedHeaders: ['Set-Cookie'],
    optionsSuccessStatus: 204,
  });
  const uploadsDir = join(process.cwd(), 'uploads');
  app.use('/uploads', express.static(uploadsDir));
  // ⬇️ ДОЛЖНО быть ДО контроллеров/гардов — чтобы req.cookies заполнялся
  app.use(cookieParser());

  // Парсеры тела (совместимо с URLSearchParams для логина)
  app.use(bodyParser.json({ limit: '2mb' }));
  app.use(bodyParser.urlencoded({ extended: false }));

  // BigInt -> number в JSON (Express setting, если доступно)
  const http = app.getHttpAdapter().getInstance();
  if (http?.set) {
    http.set('json replacer', (_key: string, value: unknown) =>
      typeof value === 'bigint' ? Number(value) : value,
    );
  } else {
    // Фолбэк: патчим res.json
    app.use((req: Request, res: Response, next: NextFunction) => {
      const orig = res.json.bind(res);
      res.json = (body: unknown) => {
        const safe = JSON.parse(
          JSON.stringify(body, (_k, v) => (typeof v === 'bigint' ? Number(v) : v)),
        );
        return orig(safe);
      };
      next();
    });
  }

  const PORT = Number(process.env.PORT || 3001);
  await app.listen(PORT, '0.0.0.0');
  (globalThis as any).__APP_LISTENING__ = true;

  // eslint-disable-next-line no-console
  console.log(`[NestApplication] started on http://localhost:${PORT}`);
}

bootstrap();
