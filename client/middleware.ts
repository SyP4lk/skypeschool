// client/middleware.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Ничего не делаем — пропускаем все запросы
export function middleware(_req: NextRequest) {
  return NextResponse.next();
}

// Полностью отключить матчер
export const config = { matcher: [] };
