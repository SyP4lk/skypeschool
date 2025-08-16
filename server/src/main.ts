import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import * as express from 'express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Разрешённые origin'ы берём из env (через запятую)
  const allowed = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((s: string) => s.trim())
    .filter(Boolean);

  app.enableCors({
    origin: (origin: string | undefined, cb: (err: Error | null, allow?: boolean) => void) => {
      if (!origin) return cb(null, true);         // серверные запросы / health
      cb(null, allowed.includes(origin));
    },
    credentials: true,
  });

  app.use(cookieParser());

  // Только API
  app.setGlobalPrefix('api');

  // Отдаём только /uploads как статику
  app.use(
    '/uploads',
    express.static(join(__dirname, '..', 'public', 'uploads'), {
      maxAge: '7d',
      fallthrough: true,
    }),
  );

  await app.listen(process.env.PORT || 3001);
}
bootstrap();
