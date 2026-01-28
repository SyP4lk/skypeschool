import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from './auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(private readonly auth: AuthService) {
    super({
      usernameField: 'login',     // ВАЖНО: поле логина — "login"
      passwordField: 'password',  // поле пароля — "password"
      session: false,
      passReqToCallback: false,
    });
  }

  async validate(login: string, password: string) {
    const user = await this.auth.validateUser(login, password);
    return { id: user.id, login: user.login, role: user.role };
  }
}
