// app/api/[...path]/route.ts
import { NextRequest, NextResponse } from 'next/server';

type Params = { path?: string[] };

const API = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api').replace(/\/+$/, '');

function ensureBackend(target: string) {
  if (/^https?:\/\/(localhost|127\.0\.0\.1):3000\b/i.test(target)) {
    throw new Error('Misconfigured NEXT_PUBLIC_API_URL: points to frontend (:3000). Must point to backend (:3001)/api.');
  }
}

function forwardHeaders(req: NextRequest) {
  const h = new Headers();
  for (const k of ['authorization', 'content-type', 'cookie']) {
    const v = req.headers.get(k);
    if (v) h.set(k, v);
  }
  return h;
}

function copySetCookie(upstream: Response, headers: Headers) {
  // next runtime поддерживает getSetCookie()
  const anyHeaders = upstream.headers as any;
  const cookies: string[] =
    (typeof anyHeaders.getSetCookie === 'function' ? anyHeaders.getSetCookie() : null) ||
    (upstream.headers.get('set-cookie') ? [String(upstream.headers.get('set-cookie'))] : []);
  for (const c of cookies) headers.append('set-cookie', c);
}

async function buildTarget(req: NextRequest, paramsPromise: Promise<Params>) {
  const { path = [] } = await paramsPromise; // обязательно await
  const search = req.nextUrl.search || '';
  // Вырезаем возможный префикс api, чтобы не задвоить
  const clean = path.join('/').replace(/^api\/?/, '');
  const target = `${API}/${clean}${search}`;
  ensureBackend(target);
  return target;
}

async function pass(method: string, req: NextRequest, ctx: { params: Promise<Params> }) {
  const target = await buildTarget(req, ctx.params);
  const hasBody = !['GET', 'HEAD'].includes(method);
  const init: RequestInit = {
    method,
    headers: forwardHeaders(req),
    cache: 'no-store',
    redirect: 'manual',
  };
  if (hasBody) {
    // прокидываем поток тела запроса
    (init as any).duplex = 'half'; // нужно для node fetch при передаче body-стрима
    init.body = req.body as any;
  }

  const upstream = await fetch(target, init);
  const text = await upstream.text();
  const ct = upstream.headers.get('content-type') || 'application/json; charset=utf-8';

  const out = new Headers({ 'content-type': ct });
  copySetCookie(upstream, out);

  return new NextResponse(text, { status: upstream.status, headers: out });
}

export async function GET(req: NextRequest, ctx: { params: Promise<Params> })    { return pass('GET', req, ctx); }
export async function POST(req: NextRequest, ctx: { params: Promise<Params> })   { return pass('POST', req, ctx); }
export async function PUT(req: NextRequest, ctx: { params: Promise<Params> })    { return pass('PUT', req, ctx); }
export async function PATCH(req: NextRequest, ctx: { params: Promise<Params> })  { return pass('PATCH', req, ctx); }
export async function DELETE(req: NextRequest, ctx: { params: Promise<Params> }) { return pass('DELETE', req, ctx); }
export async function OPTIONS(req: NextRequest, ctx: { params: Promise<Params> }){ return pass('OPTIONS', req, ctx); }
