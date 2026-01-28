import { NextRequest, NextResponse } from 'next/server';
const API = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api').replace(/\/$/, '');

export async function GET(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  const qs = new URL(req.url).search || '';
  const r = await fetch(`${API}/admin/support/threads${qs}`, {
    headers: token ? { cookie: `token=${token}` } : undefined,
    cache: 'no-store',
  });
  const t = await r.text(); try { return NextResponse.json(JSON.parse(t), { status: r.status }); }
  catch { return NextResponse.json({ raw: t }, { status: r.status }); }
}
