import { NextResponse } from 'next/server';
import { verifySession, AUTH_COOKIE } from '@/lib/auth';

// Hostnames that should bypass admin auth checks (local development)
const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1']);

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

  // Allow the admin root page to render (it contains the login form)
  // but still perform verification so already-signed-in users see the dashboard.
  // For deeper admin routes, require a valid session.

  // Ignore static assets under /admin (just in case)
  if (pathname.startsWith('/admin/_next') || pathname.startsWith('/admin/static')) {
    return NextResponse.next();
  }

  // Read token from cookies and verify
  const token = cookies.get(AUTH_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;

  // If session is valid, allow
  if (session) {
    return NextResponse.next();
  }

  // If the user is visiting the root /admin, allow page to handle login UI
  if (pathname === '/admin') {
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
