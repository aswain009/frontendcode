import { NextResponse } from 'next/server';

// Hostnames that should bypass admin auth checks (local development)
const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1']);
const ADMIN_COOKIE = 'admin_session';

export async function middleware(request) {
  const { nextUrl, cookies } = request;
  const { pathname, hostname } = nextUrl;

  // Only enforce for /admin routes; let everything else pass
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  // Bypass auth on localhost/dev hosts
  if (LOCAL_HOSTNAMES.has(hostname)) {
    return NextResponse.next();
  }

  // Ignore static assets under /admin (just in case)
  if (pathname.startsWith('/admin/_next') || pathname.startsWith('/admin/static')) {
    return NextResponse.next();
  }

  // Allow the admin root page to render (it contains the login form)
  if (pathname === '/admin') {
    return NextResponse.next();
  }

  // In production: require non-empty admin cookie for any deeper /admin route
  const token = cookies.get(ADMIN_COOKIE)?.value;
  if (token && token.length > 0) {
    return NextResponse.next();
  }

  // Otherwise, redirect to /admin (login page) and preserve intended path for potential return
  const url = new URL('/admin', request.url);
  url.searchParams.set('next', pathname);
  return NextResponse.redirect(url);
}

export const config = {
  // Match all admin pages; exclude API routes and static files automatically
  matcher: ['/admin/:path*'],
};
