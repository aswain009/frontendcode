// javascript
import { NextResponse } from 'next/server';
import { AUTH_COOKIE, authCookieOptions, signSession } from '@/lib/auth';

function resolveUrl(base, path) {
  try {
    return new URL(path, base).toString();
  } catch {
    return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
  }
}

function fetchWithTimeout(resource, options = {}, ms = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  return fetch(resource, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(id));
}

export async function POST(request) {
  const ct = request.headers.get('content-type') || '';
  let username;
  let password;

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
  const loginPath = process.env.SPRING_LOGIN_PATH || '/api/lugnuts/auth/login';
  if (!base || !/^https?:\/\//i.test(base)) {
    console.error('Invalid SPRING_API_BASE:', base);
    return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
  }

  const endpoint = resolveUrl(base, loginPath);

  try {
    const springRes = await fetchWithTimeout(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        ...(process.env.SPRING_API_KEY ? { 'X-API-Key': process.env.SPRING_API_KEY } : {})
      },
      body: new URLSearchParams({ username, password }).toString()
    });

    if (!springRes.ok) {
      const text = await springRes.text().catch(() => '');
      const msg = springRes.status === 401 ? 'Invalid credentials' : (text || 'Login failed');
      return NextResponse.json({ error: msg }, { status: springRes.status === 401 ? 401 : 400 });
    }

    const token = await signSession(username);
    const host = request.headers.get('host');
    const proto = request.headers.get('x-forwarded-proto') || 'https';
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `${proto}://${host}`;
    const redirect = NextResponse.redirect(new URL('/admin', baseUrl), { status: 303 });
    redirect.cookies.set(AUTH_COOKIE, token, authCookieOptions());
    return redirect;
  } catch (err) {
    console.error('Auth proxy error', { endpoint, message: err?.message });
    return NextResponse.json({ error: 'Auth service unavailable' }, { status: 502 });
  }
}