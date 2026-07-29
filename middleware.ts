import { NextRequest, NextResponse } from 'next/server';
// Relative import on purpose: middleware.ts is the only Edge Runtime entry
// point in this app, and Vercel's Edge Function bundler has known issues
// resolving the "@/*" tsconfig path alias for middleware specifically,
// which can surface as a false "referencing unsupported modules" build
// failure even though the imported file itself is fully Edge-safe.
import { SESSION_COOKIE_NAME, verifySessionToken } from './lib/auth';

// Paths that must stay reachable without a valid session.
const PUBLIC_PATHS = ['/login', '/api/login'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isPublic =
    PUBLIC_PATHS.some((p) => pathname === p) ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico';

  if (isPublic) {
    return NextResponse.next();
  }

  try {
    const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    const valid = await verifySessionToken(token);

    if (!valid) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
      }
      // req.nextUrl.clone() (rather than `new URL('/login', req.url)`) is
      // the pattern Next.js itself recommends for redirects inside
      // middleware — it reuses the already-parsed request URL instead of
      // re-parsing a string, which is both safer and cheaper.
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = '/login';
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  } catch (err) {
    // Never let an unexpected error here take down the whole app with a
    // raw 500 — log it (visible in Vercel's function logs) and fail safe
    // by sending the visitor to the login page instead.
    console.error('middleware error:', err);
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/login';
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
