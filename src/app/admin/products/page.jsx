import Link from 'next/link';
import { getProducts } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function AdminProductsPage() {
  let products = [];
  let error = null;
  try {
    products = await getProducts();
  } catch (e) {
    error = e.message;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Products</h1>
        <Link href="/admin/products/new" className="px-3 py-2 rounded bg-[color:var(--brand-teal)] text-white">New Product</Link>
      </div>
      {error && <div className="text-red-600">Failed to load products: {String(error)}</div>}
      <table className="w-full text-sm border rounded">
        <thead>
          <tr className="bg-gray-100">
            <th className="text-left p-2">Code</th>
            <th className="text-left p-2">Name</th>
            <th className="text-left p-2">Price</th>
            <th className="text-left p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {(products || []).map(p => (
            <tr key={p.code || p.productCode} className="border-t">
              <td className="p-2 font-mono">{p.code || p.productCode}</td>
              <td className="p-2">{p.name || p.productName || '—'}</td>
              <td className="p-2">${Number(p.price || p.msrp || 0).toFixed(2)}</td>
              <td className="p-2">
                <Link href={`/admin/products/${encodeURIComponent(p.code || p.productCode)}`} className="underline">Edit</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
