import Link from 'next/link';
import { getOrders } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function AdminOrdersPage() {
  let orders = [];
  let error = null;
  try {
    orders = await getOrders();
  } catch (e) {
    error = e.message;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Orders</h1>
        <Link href="/admin/orders/new" className="px-3 py-2 rounded bg-[color:var(--brand-teal)] text-white">New Order</Link>
      </div>
      {error && <div className="text-red-600">Failed to load orders: {String(error)}</div>}
      <table className="w-full text-sm border rounded">
        <thead>
          <tr className="bg-gray-100">
            <th className="text-left p-2">Order #</th>
            <th className="text-left p-2">Date</th>
            <th className="text-left p-2">Customer</th>
            <th className="text-left p-2">Status</th>
            <th className="text-left p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {(orders || []).map(o => (
            <tr key={o.orderNumber || o.id} className="border-t">
              <td className="p-2 font-mono">{o.orderNumber || o.id}</td>
              <td className="p-2">{o.orderDate || o.createdAt || ''}</td>
              <td className="p-2">{o.customerName || (o.customer && ([o.customer.firstName, o.customer.lastName].filter(Boolean).join(' '))) || '—'}</td>
              <td className="p-2">{o.status || '—'}</td>
              <td className="p-2">
                <Link href={`/admin/orders/${encodeURIComponent(o.orderNumber || o.id)}/edit`} className="underline text-blue-600">Edit</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
