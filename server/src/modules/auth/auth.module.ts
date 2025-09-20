import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from '../../prisma.service';
import { RegisterController } from './register.controller';

// Keep existing controllers/services if they exist
const extraControllers: any[] = [];
try { const m = require('./auth.controller'); if (m?.AuthController) extraControllers.push(m.AuthController); } catch {}
try { const m = require('./login.controller'); if (m?.LoginController) extraControllers.push(m.LoginController); } catch {}
try { const m = require('./me.controller'); if (m?.MeController) extraControllers.push(m.MeController); } catch {}

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
  controllers: [...extraControllers, RegisterController],
  providers: [PrismaService, ...extraProviders],
  exports: [JwtModule],
})
export class AuthModule {}
