// Deletes auth cookies and redirects to the home page
import { NextResponse } from 'next/server';
import { AUTH_COOKIE, authCookieOptions } from '@/lib/auth';

function clearCookie(res, name) {
    const base = authCookieOptions();
    // Expire immediately; ensure path matches original cookie
    res.cookies.set(name, '', {
        ...base,
        maxAge: 0,
        expires: new Date(0),
    });
}

export function POST(request) {
    const res = NextResponse.redirect(new URL('/', request.url), { status: 303 });
    const names = new Set([AUTH_COOKIE, 'admin_session']);
    names.forEach((n) => clearCookie(res, n));
    return res;
}

// Optional: support GET /api/logout too
export const GET = POST;