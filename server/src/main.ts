import * as cookieParser from 'cookie-parser';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());

  // из ENV: "https://client.onrender.com,https://www.prod-domain.ru"
  const allowList = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  app.enableCors({
    // массив доменов — cors сам сверит и отразит подходящий origin
    origin: allowList.length ? allowList : true, // true = отразить любой (на dev)
    credentials: true,
    methods: ['GET','HEAD','PUT','PATCH','POST','DELETE','OPTIONS'],
    allowedHeaders: ['Content-Type','Authorization'],
    optionsSuccessStatus: 204, // корректный код для preflight
  });

  await app.listen(process.env.PORT || 3001, '0.0.0.0');
}
bootstrap();
