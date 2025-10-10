import { NextRequest, NextResponse } from 'next/server';

const API = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api').replace(/\/$/, '');

export async function GET(req: NextRequest) {
  const token = req.cookies.get('token')?.value;

  // Без токена — 401 сразу
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  // Проксируем на бэк, ПОДСТАВИВ cookie token
  const res = await fetch(`${API}/auth/me`, {
    headers: {
      // важный момент: сам формируем Cookie для бэка
      cookie: `token=${token}`,
    },
    cache: 'no-store',
  });

  const text = await res.text();
  const json = (() => { try { return JSON.parse(text); } catch { return { raw: text }; } })();
  return NextResponse.json(json, { status: res.status });
}
