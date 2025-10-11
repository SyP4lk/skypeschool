import { NextRequest, NextResponse } from 'next/server';

const SERVER_API = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '');

function forwardHeaders(req: NextRequest) {
  const h = new Headers();
  for (const k of ['authorization', 'content-type', 'cookie']) {
    const v = req.headers.get(k);
    if (v) h.set(k, v);
  }
  return h;
}

function buildTarget(req: NextRequest, ctx: any) {
  const segs: string[] = Array.isArray(ctx?.params?.path) ? ctx.params.path : [];
  // если случайно прилетит первый сегмент "api" — уберём
  const clean = segs[0] === 'api' ? segs.slice(1) : segs;
  if (!SERVER_API) throw new Error('NEXT_PUBLIC_API_URL is not set');
  return `${SERVER_API}/${clean.join('/')}${req.nextUrl.search || ''}`;
}

function makeHeaders(from: Response) {
  const out = new Headers();
  out.set('content-type', from.headers.get('content-type') || 'application/json; charset=utf-8');
  // проброс Set-Cookie (в большинстве окружений приходит одной строкой)
  const sc = from.headers.get('set-cookie');
  if (sc) out.set('set-cookie', sc);
  return out;
}

async function pass(method: string, req: NextRequest, ctx: any) {
  const target = buildTarget(req, ctx);
  const hasBody = method !== 'GET' && method !== 'HEAD';

  const init: RequestInit = {
    method,
    headers: forwardHeaders(req),
    cache: 'no-store',
    redirect: 'manual',
  };

  if (hasBody) {
    (init as any).body = req.body;
    // важно для Node 18/Next при проксировании тела
    (init as any).duplex = 'half';
  }

  const upstream = await fetch(target, init);
  const text = await upstream.text();
  const headers = makeHeaders(upstream);

  return new NextResponse(text, { status: upstream.status, headers });
}

export async function GET(req: NextRequest, ctx: any)    { return pass('GET', req, ctx); }
export async function POST(req: NextRequest, ctx: any)   { return pass('POST', req, ctx); }
export async function PUT(req: NextRequest, ctx: any)    { return pass('PUT', req, ctx); }
export async function PATCH(req: NextRequest, ctx: any)  { return pass('PATCH', req, ctx); }
export async function DELETE(req: NextRequest, ctx: any) { return pass('DELETE', req, ctx); }
export async function OPTIONS(req: NextRequest, ctx: any){ return pass('OPTIONS', req, ctx); }
