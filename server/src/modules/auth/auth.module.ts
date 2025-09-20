import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from '../../prisma.service';
import { AuthController } from './auth.controller';

const extraProviders: any[] = [];
try { const m = require('./auth.service'); if (m?.AuthService) extraProviders.push(m.AuthService); } catch {}
try { const m = require('./jwt.strategy'); if (m?.JwtStrategy) extraProviders.push(m.JwtStrategy); } catch {}
try { const m = require('./local.strategy'); if (m?.LocalStrategy) extraProviders.push(m.LocalStrategy); } catch {}

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'dev-secret',
      signOptions: { expiresIn: '30d' },
    }),
  ],
  controllers: [AuthController],
  providers: [PrismaService, ...extraProviders],
  exports: [JwtModule],
})
export class AuthModule {}
