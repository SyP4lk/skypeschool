// runtime: node (не edge)
import { NextRequest, NextResponse } from 'next/server';

const API = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api').replace(/\/$/, '');

export async function POST(req: NextRequest) {
  const body = await req.text();

  // Проксируем логин на бэк
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
    // важно: куки бэка нам не нужны тут как "клиенту", мы их перечитаем из заголовка
    redirect: 'manual',
  });

  // Перетягиваем бэковский Set-Cookie с токеном и кладём "свой" cookie на 3000
  const setCookie = res.headers.get('set-cookie') || '';
  // простейший парсинг: token=...;
  const m = setCookie.match(/(?:^|;\s*)token=([^;]+)/i);
  const token = m?.[1];

  const data = await res.text(); // передадим клиенту тело, какое вернул бэк
  const jsonOk = (() => { try { return JSON.parse(data); } catch { return null; } })();

  // Ответ клиенту (избегаем проброса всего Set-Cookie от чужого Origin)
  const out = NextResponse.json(jsonOk ?? { ok: res.ok }, { status: res.status });

  // Если токен получили — садим cookie на фронтовом домене (3000)
  if (token) {
    out.cookies.set('token', token, {
      httpOnly: true,
      sameSite: 'lax', // на одном origin (3000) будет ок
      path: '/',       // доступен везде
      // secure: false — на http localhost нельзя secure
      maxAge: 60 * 60 * 24 * 7, // неделя
    });
  }

  return out;
}
