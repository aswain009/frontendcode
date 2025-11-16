// Deletes local session cookie; optionally calls Spring logout
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AUTH_COOKIE } from '@/lib/auth';

function resolveUrl(base, path) {
    try {
        return new URL(path, base).toString();
    } catch {
        return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
    }
}

export async function POST() {
    // Optional: tell Spring to invalidate its session if it maintains one
    const base = process.env.SPRING_API_BASE;
    const logoutPath = process.env.SPRING_LOGOUT_PATH || '/auth/logout';
    if (base) {
        try {
            await fetch(resolveUrl(base, logoutPath), {
                method: 'POST',
                headers: {
                    ...(process.env.SPRING_API_KEY ? { 'X-API-Key': process.env.SPRING_API_KEY } : {}),
                },
            });
        } catch {
            // ignore upstream errors; still clear the local cookie
        }
    }

    cookies().delete(AUTH_COOKIE);
    return NextResponse.json({ success: true });
}