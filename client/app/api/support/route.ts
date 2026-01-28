import { NextRequest, NextResponse } from 'next/server';
const API = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api').replace(/\/$/, '');

export async function POST(req: NextRequest) {
  const body = await req.text();
  const r = await fetch(`${API}/support`, { method: 'POST', headers: { 'content-type': 'application/json' }, body });
  const t = await r.text(); try { return NextResponse.json(JSON.parse(t), { status: r.status }); }
  catch { return NextResponse.json({ raw: t }, { status: r.status }); }
}
