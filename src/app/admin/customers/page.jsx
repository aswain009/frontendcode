import Link from 'next/link';
import { getCustomers } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function AdminCustomersPage() {
  let customers = [];
  let error = null;
  try {
    customers = await getCustomers();
  } catch (e) {
    error = e.message;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Customers</h1>
        <Link href="/admin/customers/new" className="px-3 py-2 rounded bg-[color:var(--brand-teal)] text-white">New Customer</Link>
      </div>
      {error && <div className="text-red-600">Failed to load customers: {String(error)}</div>}
      <table className="w-full text-sm border rounded">
        <thead>
          <tr className="bg-gray-100">
            <th className="text-left p-2">ID</th>
            <th className="text-left p-2">Name</th>
            <th className="text-left p-2">Email</th>
            <th className="text-left p-2">Phone</th>
            <th className="text-left p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {(customers || []).map(c => (
            <tr key={c.id} className="border-t">
              <td className="p-2 font-mono">{c.id}</td>
              <td className="p-2">{[c.firstName, c.lastName].filter(Boolean).join(' ') || c.name || '—'}</td>
              <td className="p-2">{c.email || '—'}</td>
              <td className="p-2">{c.phone || '—'}</td>
              <td className="p-2">
                <Link href={`/admin/customers/${encodeURIComponent(c.id)}`} className="underline">Edit</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
