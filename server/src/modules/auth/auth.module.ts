import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from '../../prisma.service';

import { AuthController } from './auth.controller';
import { RegisterController } from './register.controller';

// Опциональные (если существуют в проекте — подтянем; если нет — игнор)
const extraControllers: any[] = [];
try {
  const m = require('./login.controller');
  if (m?.LoginController) extraControllers.push(m.LoginController);
} catch {}
try {
  const m = require('./me.controller');
  if (m?.MeController) extraControllers.push(m.MeController);
} catch {}

const extraProviders: any[] = [];
try {
  const m = require('./auth.service');
  if (m?.AuthService) extraProviders.push(m.AuthService);
} catch {}
try {
  const m = require('./jwt.strategy');
  if (m?.JwtStrategy) extraProviders.push(m.JwtStrategy);
} catch {}
try {
  const m = require('./local.strategy');
  if (m?.LocalStrategy) extraProviders.push(m.LocalStrategy);
} catch {}

@Module({
  imports: [
    JwtModule.register({
      global: true, // чтобы JwtService был доступен вне AuthModule
      secret: process.env.JWT_SECRET || 'dev-secret',
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
    }),
  ],
  controllers: [
    AuthController,        // гарантированно подключаем
    RegisterController,
    ...extraControllers,   // подключим, если есть
  ],
  providers: [
    PrismaService,
    ...extraProviders,     // подключим, если есть
  ],
  exports: [JwtModule],
})
export class AuthModule {}
