import * as cookieParser from 'cookie-parser';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import type { Request, Response, NextFunction } from 'express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.setGlobalPrefix('api');
  app.use(cookieParser());
  app.set('trust proxy', 1);

  const allowList = (process.env.ALLOWED_ORIGINS || '')
    .split(',').map(s => s.trim()).filter(Boolean);
  const allowSet = new Set(allowList);

  app.use((req: Request, res: Response, next: NextFunction) => {
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
