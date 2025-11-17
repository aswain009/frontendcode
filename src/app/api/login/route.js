// Forwards credentials to Spring API, then redirects to /admin on success
import { NextResponse } from 'next/server';
import { AUTH_COOKIE, authCookieOptions, signSession } from '@/lib/auth';

function resolveUrl(base, path) {
    try {
        return new URL(path, base).toString();
    } catch {
        return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
    }
}

export async function POST(request) {
    const ct = request.headers.get('content-type') || '';

    let username;
    let password;

    // Accept credentials from JSON or <form> submissions
    if (ct.includes('application/json')) {
        const body = await request.json().catch(() => ({}));
        username = body?.username;
        password = body?.password;
    } else if (ct.includes('application/x-www-form-urlencoded') || ct.includes('multipart/form-data')) {
        const form = await request.formData().catch(() => null);
        if (form) {
            username = form.get('username');
            password = form.get('password');
        }
    } else {
        // Fallback: try JSON then form
        try {
            const body = await request.json();
            username = body?.username;
            password = body?.password;
        } catch {
            const form = await request.formData().catch(() => null);
            if (form) {
                username = form.get('username');
                password = form.get('password');
            }
        }
    }

    if (!username || !password) {
        return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
    }

    const base = process.env.SPRING_API_BASE;
    const loginPath = process.env.SPRING_LOGIN_PATH || '/auth/login'; // match your Spring mapping
    if (!base) {
        return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
    }

    try {
        // Send as x-www-form-urlencoded so @RequestParam binds
        const springRes = await fetch(resolveUrl(base, loginPath), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                ...(process.env.SPRING_API_KEY ? { 'X-API-Key': process.env.SPRING_API_KEY } : {}),
            },
            body: new URLSearchParams({ username, password }).toString(),
        });

        if (!springRes.ok) {
            const text = await springRes.text().catch(() => '');
            const msg = springRes.status === 401 ? 'Invalid credentials' : (text || 'Login failed');
            return NextResponse.json({ error: msg }, { status: springRes.status === 401 ? 401 : 400 });
        }

        // Create session and redirect to /admin
        const token = await signSession(username);
        const redirect = NextResponse.redirect(new URL('/admin', request.url), { status: 303 }); // POST -> GET
        redirect.cookies.set(AUTH_COOKIE, token, authCookieOptions());
        return redirect;
    } catch {
        return NextResponse.json({ error: 'Auth service unavailable' }, { status: 502 });
    }
}