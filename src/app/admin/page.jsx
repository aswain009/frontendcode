import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function AdminHome() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Admin</h1>
      <p className="text-sm text-gray-700">Manage customers, products, and orders.</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/admin/customers" className="border rounded p-4 hover:shadow bg-white/70">
          <div className="font-semibold">Customers</div>
          <div className="text-sm text-gray-600">Create, edit, and remove customers.</div>
        </Link>
        <Link href="/admin/products" className="border rounded p-4 hover:shadow bg-white/70">
          <div className="font-semibold">Products</div>
          <div className="text-sm text-gray-600">Create, edit, and remove products.</div>
        </Link>
        <Link href="/admin/orders" className="border rounded p-4 hover:shadow bg-white/70">
          <div className="font-semibold">Orders</div>
          <div className="text-sm text-gray-600">View and manually create orders.</div>
        </Link>
      </div>
    </div>
  );
}
