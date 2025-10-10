import { NextRequest, NextResponse } from 'next/server';
const API = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api').replace(/\/$/, '');

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const token = req.cookies.get('token')?.value;
  const url = new URL(req.url);
  const after = url.searchParams.get('after');
  const r = await fetch(`${API}/admin/support/threads/${params.id}/messages${after ? `?after=${encodeURIComponent(after)}` : ''}`, {
    headers: token ? { cookie: `token=${token}` } : undefined,
    cache: 'no-store',
  });
  const t = await r.text(); try { return NextResponse.json(JSON.parse(t), { status: r.status }); }
  catch { return NextResponse.json({ raw: t }, { status: r.status }); }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const token = req.cookies.get('token')?.value;
  const body = await req.text();
  const r = await fetch(`${API}/admin/support/threads/${params.id}/messages`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(token ? { cookie: `token=${token}` } : {}) },
    body,
  });
  const t = await r.text(); try { return NextResponse.json(JSON.parse(t), { status: r.status }); }
  catch { return NextResponse.json({ raw: t }, { status: r.status }); }
}
