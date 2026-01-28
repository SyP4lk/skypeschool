import { NextResponse } from 'next/server';

export function GET(req: Request) {
  // 308 — постоянный редирект, работает и для SPA переходов
  return NextResponse.redirect(new URL('/teachers', req.url), 308);
}

export function HEAD(req: Request) {
  return GET(req);
}

// Хинт билдеру — здесь ничего динамического не рендерим
export const dynamic = 'force-static';
