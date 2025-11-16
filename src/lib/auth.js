// src/lib/auth.js
import { SignJWT, jwtVerify } from 'jose';

export const AUTH_COOKIE = 'admin_session';

function getSecretKey() {
    const secret = process.env.AUTH_SECRET;
    if (!secret) {
        throw new Error('Missing AUTH_SECRET environment variable');
    }
    return new TextEncoder().encode(secret);
}

export async function signSession(username) {
    const secretKey = getSecretKey();
    return await new SignJWT({ sub: username, role: 'admin' })
        .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
        .setIssuedAt()
        .setExpirationTime('8h') // session lifetime
        .sign(secretKey);
}

export async function verifySession(token) {
    try {
        const secretKey = getSecretKey();
        const { payload } = await jwtVerify(token, secretKey);
        return payload; // { sub, role, iat, exp }
    } catch {
        return null;
    }
}

export function authCookieOptions() {
    return {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 8, // 8h in seconds
    };
}