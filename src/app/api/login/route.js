// Forwards credentials to Spring API, then sets a local httpOnly session cookie
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AUTH_COOKIE, authCookieOptions, signSession } from '@/lib/auth';

function resolveUrl(base, path) {
    try {
        return new URL(path, base).toString();
    } catch {
        return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
    }
}

export async function POST(request) {
    const body = await request.json().catch(() => ({}));
    const { username, password } = body || {};

    if (!username || !password) {
        return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
    }

    const base = process.env.SPRING_API_BASE;
    const loginPath = process.env.SPRING_LOGIN_PATH || '/auth/login';
    if (!base) {
        return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
    }

    try {
        const res = await fetch(resolveUrl(base, loginPath), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(process.env.SPRING_API_KEY ? { 'X-API-Key': process.env.SPRING_API_KEY } : {}),
            },
            body: JSON.stringify({ username, password }),
        });

        if (!res.ok) {
            let msg = 'Invalid credentials';
            try {
                const data = await res.json();
                msg = data?.error || data?.message || msg;
            } catch {}
            return NextResponse.json({ error: msg }, { status: res.status === 401 ? 401 : 400 });
        }

        // If Spring returns user info, you can read it here:
        // const data = await res.json().catch(() => ({}));

        // Mint a session cookie local to this app domain
        const token = await signSession(username);
        cookies().set(AUTH_COOKIE, token, authCookieOptions());

        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: 'Auth service unavailable' }, { status: 502 });
    }
}