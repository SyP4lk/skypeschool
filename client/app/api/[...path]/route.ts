import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const API = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api').replace(/\/+$/, '');

type Params = { path?: string[] };

function ensureBackend(target: string) {
  if (/^https?:\/\/(localhost|127\.0\.0\.1):3000\b/i.test(target)) {
    throw new Error('Misconfigured NEXT_PUBLIC_API_URL: points to frontend :3000. Must be backend :3001/api.');
  }
}

function fwd(req: NextRequest) {
  const h: Record<string,string> = {};
  for (const k of ['authorization','content-type','cookie']) {
    const v = req.headers.get(k); if (v) h[k] = v;
  }
  return h;
}

async function url(req: NextRequest, params: Promise<Params>) {
  const { path = [] } = await params; // await обязательно
  const s = req.nextUrl.search || '';
  const u = `${API}/${path.join('/')}${s}`;
  ensureBackend(u);
  return u;
}

async function pass(method: string, req: NextRequest, ctx: { params: Promise<Params> }) {
  const target = await url(req, ctx.params);
  const hasBody = !['GET','HEAD'].includes(method);

  const init: RequestInit & { duplex?: 'half' } = {
    method,
    headers: fwd(req),
    cache: 'no-store',
    redirect: 'manual',
  };
  if (hasBody) { init.body = req.body as any; init.duplex = 'half'; }

  const r = await fetch(target, init);

  const rh = new Headers();
  r.headers.forEach((v,k)=>rh.set(k,v));

  return new NextResponse(r.body, { status: r.status, headers: rh });
}

export const GET = (req: NextRequest, ctx: any)=>pass('GET', req, ctx);
export const POST = (req: NextRequest, ctx: any)=>pass('POST', req, ctx);
export const PUT = (req: NextRequest, ctx: any)=>pass('PUT', req, ctx);
export const PATCH = (req: NextRequest, ctx: any)=>pass('PATCH', req, ctx);
export const DELETE = (req: NextRequest, ctx: any)=>pass('DELETE', req, ctx);
export const OPTIONS = (req: NextRequest, ctx: any)=>pass('OPTIONS', req, ctx);
