import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import * as express from 'express';
import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: false });

  // Express instance (для trust proxy и health)
  const expressApp = app.getHttpAdapter().getInstance();
  // Secure-cookie за прокси Render/Cloudflare
  expressApp.set('trust proxy', 1);

  // Глобальный префикс /api
  app.setGlobalPrefix('api');

  // Тела: json + urlencoded (для логина/регистрации без preflight)
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Куки
  app.use(cookieParser());

  // CORS
  const allowed = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  const corsOptions: CorsOptions = {
    origin: (origin: string | undefined, cb: (err: Error | null, allow?: boolean) => void) => {
      if (!origin) return cb(null, true);                 // SSR/инструменты без Origin
      if (allowed.includes(origin)) return cb(null, true);
      return cb(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization',
    exposedHeaders: 'Set-Cookie',
  };
  app.enableCors(corsOptions);

  // Быстрый health для прогрева
  expressApp.get('/api/health', (_req: any, res: any) => res.status(200).send('ok'));

  const port = process.env.PORT || 3001;
  await app.listen(port);
}
bootstrap();
