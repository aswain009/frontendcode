// src/app/api/logout/route.js
import { NextResponse } from 'next/server';
import { AUTH_COOKIE, authCookieOptions } from '@/lib/auth';

function clearCookie(res, name) {
  const base = authCookieOptions();
  res.cookies.set(name, '', {
    ...base,
    maxAge: 0,
    expires: new Date(0),
  });
}

export function POST(request) {
  const host = request.headers.get('host');
  const proto = request.headers.get('x-forwarded-proto') || 'https';
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `${proto}://${host}`;
  const res = NextResponse.redirect(new URL('/', baseUrl), { status: 303 });
  const names = new Set([AUTH_COOKIE, 'admin_session']);
  names.forEach((n) => clearCookie(res, n));
  return res;
}

export const GET = POST;