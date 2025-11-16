// Server Component: Protects the admin page and shows a simple login form if not authenticated.
import { cookies } from 'next/headers';
import { AUTH_COOKIE, verifySession } from '@/lib/auth';
import Link from 'next/link';

export default async function AdminPage() {
    const token = cookies().get(AUTH_COOKIE)?.value;
    const session = token ? await verifySession(token) : null;

    if (!session) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center px-4">
                <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                    <h1 className="text-xl font-semibold mb-4">Admin sign-in</h1>
                    <form id="admin-login-form" className="space-y-4">
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                                Username
                            </label>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                autoComplete="username"
                                required
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter username"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter password"
                            />
                        </div>

                        <p id="login-error" className="text-sm text-red-600 min-h-[1.25rem]" role="alert" />

                        <button
                            type="submit"
                            className="inline-flex w-full items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
                        >
                            Sign in
                        </button>
                    </form>

                    {/* Inline script to handle login without needing a Client Component */}
                    <script
                        dangerouslySetInnerHTML={{
                            __html: `
              (function () {
                const form = document.getElementById('admin-login-form');
                if (!form) return;
                form.addEventListener('submit', async function (e) {
                  e.preventDefault();
                  const btn = form.querySelector('button[type="submit"]');
                  const err = document.getElementById('login-error');
                  err.textContent = '';
                  btn?.setAttribute('disabled', '');
                  try {
                    const fd = new FormData(form);
                    const payload = {
                      username: (fd.get('username') || '').toString(),
                      password: (fd.get('password') || '').toString(),
                    };
                    const res = await fetch('/api/login', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(payload),
                    });
                    if (res.ok) {
                      // Cookie is set by the API; reload back to /admin
                      window.location.href = '/admin';
                    } else {
                      let msg = 'Login failed';
                      try {
                        const data = await res.json();
                        if (data && typeof data.error === 'string') msg = data.error;
                      } catch (_) {}
                      err.textContent = msg;
                    }
                  } catch (e) {
                    err.textContent = 'Network error. Please try again.';
                  } finally {
                    btn?.removeAttribute('disabled');
                  }
                });
              })();
            `,
                        }}
                    />
                </div>
            </div>
        );
    }

    // Authenticated admin landing content
    return (
        <div className="px-6 py-8">
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Admin</h1>
                <form action="/api/logout" method="POST">
                    <button
                        type="submit"
                        className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
                        title="Sign out"
                    >
                        Log out
                    </button>
                </form>
            </div>

            <p className="text-sm text-gray-600 mb-4">Welcome{session?.sub ? `, ${session.sub}` : ''}.</p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                <Link
                    href="/admin/orders"
                    className="rounded-md border border-gray-200 p-4 hover:bg-gray-50"
                >
                    Orders
                </Link>
                <Link
                    href="/admin/products"
                    className="rounded-md border border-gray-200 p-4 hover:bg-gray-50"
                >
                    Products
                </Link>
                <Link
                    href="/admin/customers"
                    className="rounded-md border border-gray-200 p-4 hover:bg-gray-50"
                >
                    Customers
                </Link>
            </div>
        </div>
    );
}