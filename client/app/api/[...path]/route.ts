// Next.js App Router proxy with awaited params + rewrite for /teachers -> /public/teachers
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function normalizeTarget(base: string) {
  if (!base) return 'http://localhost:3000';
  return base.replace(/\/$/, '');
}

function buildTargetUrl(req: NextRequest, segments: string[]) {
  const baseRaw = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:3000';
  const base = normalizeTarget(baseRaw);
  const hasApi = /\/api$/i.test(base);

  // Rewrite: /api/teachers* -> /api/public/teachers*
  let segs = [...(segments || [])];
  if (segs[0] === 'teachers') {
    segs = ['public', ...segs];
  }

  const path = `/${segs.join('/')}`;
  const remotePath = (hasApi ? '' : '/api') + path;
  const search = req.nextUrl.search || '';
  return base + remotePath + search;
}

async function forward(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const url = buildTargetUrl(req, path || []);
  const headers = new Headers(req.headers);
  headers.delete('host');
  headers.set('x-forwarded-host', req.headers.get('host') || '');
  headers.set('x-forwarded-proto', req.nextUrl.protocol.replace(':',''));

  const method = req.method.toUpperCase();
  const isBodyAllowed = method !== 'GET' && method !== 'HEAD';
  const init: any = { method, headers, redirect: 'manual' };

  if (isBodyAllowed) {
    init.duplex = 'half';
    init.body = req.body;
  }

  try {
    const res = await fetch(url, init as RequestInit);
    const nextHeaders = new Headers();
    const ct = res.headers.get('content-type');
    if (ct) nextHeaders.set('content-type', ct);
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) nextHeaders.append('set-cookie', setCookie);
    return new NextResponse(res.body, { status: res.status, statusText: res.statusText, headers: nextHeaders });
  } catch (e: any) {
    const msg = (e?.cause?.code === 'ECONNREFUSED')
      ? `Backend is not reachable at ${url}. Check that your server is running and NEXT_PUBLIC_API_URL points to the correct host/port.`
      : (e?.message || 'Proxy request failed');
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}

export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const PATCH = forward;
export const DELETE = forward;
