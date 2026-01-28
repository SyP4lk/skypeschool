import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, 'client', 'public', 'data');
const UPLOAD_DIR = path.join(ROOT, 'client', 'public', 'uploads', 'popular-lessons');
const JSON_PATH = path.join(DATA_DIR, 'popular-lessons.json');

type Item = { id: string; title: string; alt: string; icon: string; order?: number };

async function readList(): Promise<Item[]> {
  try {
    const txt = await fs.readFile(JSON_PATH, 'utf8');
    const data = JSON.parse(txt);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function writeList(list: Item[]) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(JSON_PATH, JSON.stringify(list, null, 2), 'utf8');
}

export async function GET() {
  const list = await readList();
  return NextResponse.json({ items: list });
}

export async function POST(req: NextRequest) {
  const ctype = req.headers.get('content-type') || '';
  if (ctype.includes('multipart/form-data')) {
    const form = await req.formData();
    const title = String(form.get('title') || '').trim();
    const alt = String(form.get('alt') || title).trim();
    const order = Number(form.get('order') || 0);
    const file = form.get('file') as unknown as File | null;

    if (!title) return NextResponse.json({ message: 'title required' }, { status: 400 });
    if (!file) return NextResponse.json({ message: 'file required' }, { status: 400 });

    const buf = Buffer.from(await file.arrayBuffer());
    const ext = (file.type && file.type.includes('png')) ? 'png'
            : (file.type && file.type.includes('webp')) ? 'webp'
            : 'jpg';
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    const id = randomUUID();
    const fname = `${id}.${ext}`;
    await fs.writeFile(path.join(UPLOAD_DIR, fname), buf);

    const icon = `/uploads/popular-lessons/${fname}`;

    const list = await readList();
    list.push({ id, title, alt, icon, order: Number.isFinite(order) ? order : 0 });
    list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    await writeList(list);

    return NextResponse.json({ ok: true, item: { id, title, alt, icon, order: Number.isFinite(order) ? order : 0 } });
  }

  const data = await req.json().catch(() => ({}));
  const { id, title, alt, order } = data || {};
  if (!id) return NextResponse.json({ message: 'id required' }, { status: 400 });
  const list = await readList();
  const idx = list.findIndex(x => x.id === id);
  if (idx < 0) return NextResponse.json({ message: 'not found' }, { status: 404 });

  if (typeof title === 'string') list[idx].title = title.trim();
  if (typeof alt === 'string') list[idx].alt = alt.trim();
  if (order !== undefined && order !== null) list[idx].order = Number(order) || 0;

  list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  await writeList(list);
  return NextResponse.json({ ok: true, item: list[idx] });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ message: 'id required' }, { status: 400 });

  const list = await readList();
  const idx = list.findIndex(x => x.id === id);
  if (idx < 0) return NextResponse.json({ message: 'not found' }, { status: 404 });

  const [removed] = list.splice(idx, 1);
  await writeList(list);

  try {
    const filename = removed.icon?.split('/').pop();
    if (filename) await fs.unlink(path.join(UPLOAD_DIR, filename));
  } catch {}

  return NextResponse.json({ ok: true });
}