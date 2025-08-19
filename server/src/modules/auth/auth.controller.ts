// server/src/modules/auth/auth.controller.ts (фрагмент)
import { Res, HttpCode, Post, Body } from '@nestjs/common';
import { Response } from 'express';

@Post('login')
@HttpCode(200)
async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
  const token = await this.authService.login(dto);
  const isProd = process.env.NODE_ENV === 'production';

  res.cookie('jwt', token, {
    httpOnly: true,
    secure: isProd,                 // на Render = true
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });

  return { ok: true };
}

@Post('logout')
@HttpCode(200)
logout(@Res({ passthrough: true }) res: Response) {
  const isProd = process.env.NODE_ENV === 'production';
  res.clearCookie('jwt', {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
  });
  return { ok: true };
}
