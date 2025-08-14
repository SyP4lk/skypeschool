import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const { pathname, origin } = req.nextUrl;

  if (pathname.startsWith('/admin')) {
    const token = req.cookies.get('token')?.value; // cookie from Nest (`token`)
    if (!token) {
      const url = new URL('/login', origin);
      url.searchParams.set('callback', pathname);
      return NextResponse.redirect(url);
    }

    // Optional: ping backend to validate token quickly
    try {
      const api = process.env.NEXT_PUBLIC_API_URL;
      if (api) {
        const res = await fetch(`${api}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });
        if (!res.ok) throw new Error('invalid');
      }
    } catch {
      const res = NextResponse.redirect(new URL('/login', origin));
      res.cookies.delete('token');
      return res;
    }
  }

  return NextResponse.next();
}

export const config = { matcher: ['/admin/:path*'] };
