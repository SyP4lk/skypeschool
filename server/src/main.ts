import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { ALLOWED_ORIGINS } from './config/env';
import * as bodyParser from 'body-parser';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: ALLOWED_ORIGINS.length ? ALLOWED_ORIGINS : true,
    credentials: true,
    methods: ['GET','HEAD','PUT','PATCH','POST','DELETE','OPTIONS'],
    allowedHeaders: ['Content-Type','Authorization'],
    exposedHeaders: ['Set-Cookie'],
  });

  app.use(cookieParser());
  // ✅ ВАЖНО: корректный глобальный префикс без двоеточий
  app.setGlobalPrefix('api');
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());

  const port = Number(process.env.PORT || 3000);
  await app.listen(port, '0.0.0.0');
  // eslint-disable-next-line no-console
  console.log(`[NestApplication] started on http://localhost:${port}`);
}
bootstrap();
