// app/api/admin/support/threads/[id]/messages/route.ts
import { NextResponse } from 'next/server';

const API = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api').replace(/\/+$/, '');

function forwardHeaders(req: Request) {
  const out: Record<string, string> = {};
  // переносим только нужное
  for (const h of ['authorization', 'content-type', 'cookie']) {
    const v = req.headers.get(h);
    if (v) out[h] = v;
  }
  return out;
}

function contentType(res: Response) {
  return res.headers.get('content-type') || 'application/json; charset=utf-8';
}

/** GET /api/admin/support/threads/[id]/messages */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const url = new URL(req.url);
  const target = `${API}/admin/support/threads/${encodeURIComponent(params.id)}/messages${url.search}`;

  const r = await fetch(target, {
    method: 'GET',
    headers: forwardHeaders(req),
    cache: 'no-store',
    redirect: 'manual',
  });

  const body = await r.text();
  return new NextResponse(body, { status: r.status, headers: { 'content-type': contentType(r) } });
}

/** POST /api/admin/support/threads/[id]/messages */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const url = new URL(req.url);
  const target = `${API}/admin/support/threads/${encodeURIComponent(params.id)}/messages${url.search}`;

  // важный момент для node-fetch в Next: duplex:'half' при проксировании body
  const r = await fetch(target, {
    method: 'POST',
    headers: forwardHeaders(req),
    body: req.body,
    cache: 'no-store',
    redirect: 'manual',
    // @ts-expect-error — duplex есть в RequestInit у Node 18, TS может ругаться
    duplex: 'half',
  });

  const body = await r.text();
  return new NextResponse(body, { status: r.status, headers: { 'content-type': contentType(r) } });
}
