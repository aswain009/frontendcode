// Server Component: Protects the admin page and shows a simple login form if not authenticated.
import { cookies } from 'next/headers';
import { AUTH_COOKIE, verifySession } from '@/lib/auth';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE)?.value;
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
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black"
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
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black"
                            />
                        </div>
                        <button
                            formAction="/api/login"
                            formMethod="POST"
                            className="w-full rounded-md bg-black px-4 py-2 text-white hover:bg-gray-900"
                        >
                            Sign in
                        </button>
                    </form>
                    <p className="mt-4 text-sm text-gray-500">
                        <Link href="/" className="underline">Back to store</Link>
                    </p>
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