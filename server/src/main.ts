import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import * as express from 'express';
import { ALLOWED_ORIGINS } from './config/env';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Устанавливаем trust proxy через нативный Express-инстанс (типобезопасно для Nest)
  const adapter = app.getHttpAdapter() as any;
  const instance: any = adapter?.getInstance ? adapter.getInstance() : adapter;
  if (instance?.set) {
    instance.set('trust proxy', 1);
  }

  // CORS для кросс-доменных кук
  app.enableCors({
    origin: ALLOWED_ORIGINS.length ? ALLOWED_ORIGINS : true,
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Set-Cookie'],
    optionsSuccessStatus: 204,
  });

  // Парсеры тела и cookie (urlencoded нужен для форм без preflight)
  app.use(cookieParser());
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '5mb' }));

  // Глобальный префикс API
  app.setGlobalPrefix('api');

  const port = Number(process.env.PORT || 3000);
  await app.listen(port, '0.0.0.0');
  // eslint-disable-next-line no-console
  console.log(`[NestApplication] started on http://localhost:${port}`);
}
bootstrap();
