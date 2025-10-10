import { NextRequest, NextResponse } from 'next/server';
const API = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api').replace(/\/$/, '');

export async function POST() {
  // Попросим бэк "разлогиниться" (если есть эндпоинт), но независимо — чистим локальную cookie
  try {
    await fetch(`${API}/auth/logout`, { method: 'POST' }).catch(() => {});
  } catch {}

  const out = NextResponse.json({ ok: true });
  out.cookies.set('token', '', { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 0 });
  return out;
}
