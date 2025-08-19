// server/src/main.ts
import * as cookieParser from 'cookie-parser';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());
  app.set('trust proxy', 1); // Render за прокси — нужно для secure cookies

  const allowList = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  const allowSet = new Set(allowList);

  // Глобальный CORS-миддлвар — ставит заголовки на ЛЮБОЙ ответ (в т.ч. ошибки)
  app.use((req, res, next) => {
    const origin = req.headers.origin as string | undefined;
    const ok = !origin || allowList.length === 0 || allowSet.has(origin);

    if (ok && origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Vary', 'Origin');
    }

    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
      return res.sendStatus(204);
    }
    next();
  });

  // Оставляем enableCors (дублирует поведение, но не мешает)
  app.enableCors({
    origin: allowList.length ? allowList : true,
    credentials: true,
    methods: ['GET','HEAD','PUT','PATCH','POST','DELETE','OPTIONS'],
    allowedHeaders: ['Content-Type','Authorization'],
    optionsSuccessStatus: 204,
  });

  await app.listen(process.env.PORT || 3001, '0.0.0.0');
}
bootstrap();
