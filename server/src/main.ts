import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from './config/env';
import * as cookieParser from 'cookie-parser';
import * as express from 'express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const cfg = app.get(ConfigService);

  // CORS под фронтовый домен (Render)
  app.enableCors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      const allowed = (cfg.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
      cb(null, allowed.includes(origin));
    },
    credentials: true,
  });

  app.use(cookieParser());

  // Глобальный префикс API
  app.setGlobalPrefix('api');

  // Только /uploads как статика
  app.use(
    '/uploads',
    express.static(join(__dirname, '..', 'public', 'uploads'), {
      maxAge: '7d',
      fallthrough: true,
    }),
  );

  const port = process.env.PORT || 3001;
  await app.listen(port);
}
bootstrap();
