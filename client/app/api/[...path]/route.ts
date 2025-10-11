import { NextRequest, NextResponse } from 'next/server';

const SERVER_API = (process.env.SERVER_API_URL || '').replace(/\/+$/, '');
if (!SERVER_API) {
  // Чтобы 500 не был «тихим»
  console.warn('SERVER_API_URL is not set. Set it to https://<server>/api');
}

type Ctx = { params: { path?: string[] } };

function buildTarget(req: NextRequest, pathSegs: string[] | undefined) {
  const segs = Array.isArray(pathSegs) ? pathSegs : [];
  // наш локальный роут начинается с /api, убираем первый сегмент "api" если он затесался
  const clean = segs[0] === 'api' ? segs.slice(1) : segs;
  const search = req.nextUrl.search || '';
  if (!SERVER_API) throw new Error('SERVER_API_URL is not configured');
  return `${SERVER_API}/${clean.join('/')}${search}`;
}

function forwardHeaders(req: NextRequest) {
  const out = new Headers();
  // важные заголовки
  for (const h of ['authorization', 'content-type', 'cookie']) {
    const v = req.headers.get(h);
    if (v) out.set(h, v);
  }
  return out;
}

function copySetCookieAndType(from: Response) {
  const headers = new Headers();
  const ct = from.headers.get('content-type') || 'application/json; charset=utf-8';
  headers.set('content-type', ct);

  // пробрасываем Set-Cookie (их может быть несколько)
  const setCookies = from.headers.getSetCookie?.() ?? [];
  if (setCookies.length) {
    // NextResponse сам умеет массивом
    headers.append('set-cookie', setCookies.join(', '));
  } else {
    // fallback для окружений без getSetCookie
    const sc = from.headers.get('set-cookie');
    if (sc) headers.append('set-cookie', sc);
  }
  return headers;
}

async function pass(method: string, req: NextRequest, ctx: Ctx) {
  const target = buildTarget(req, ctx.params.path);
  const hasBody = !['GET', 'HEAD'].includes(method);

  const init: RequestInit = {
    method,
    headers: forwardHeaders(req),
    cache: 'no-store',
    redirect: 'manual',
  };

  if (hasBody) {
    // важно: проксируем поток тела и ставим duplex: 'half'
    (init as any).body = req.body;
    (init as any).duplex = 'half';
  }

  const upstream = await fetch(target, init);
  const bodyText = await upstream.text();
  const headers = copySetCookieAndType(upstream);

  return new NextResponse(bodyText, { status: upstream.status, headers });
}

export async function GET(req: NextRequest, ctx: Ctx)   { return pass('GET', req, ctx); }
export async function POST(req: NextRequest, ctx: Ctx)  { return pass('POST', req, ctx); }
export async function PUT(req: NextRequest, ctx: Ctx)   { return pass('PUT', req, ctx); }
export async function PATCH(req: NextRequest, ctx: Ctx) { return pass('PATCH', req, ctx); }
export async function DELETE(req: NextRequest, ctx: Ctx){ return pass('DELETE', req, ctx); }
export async function OPTIONS(req: NextRequest, ctx: Ctx){ return pass('OPTIONS', req, ctx); }
