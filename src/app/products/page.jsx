import Link from 'next/link';
import { getProducts } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  let products = [];
  let error = null;
  try {
    products = await getProducts();
  } catch (e) {
    error = e.message;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Products</h1>
      {error && <p className="text-red-600">Failed to load products: {String(error)}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {(products || []).map((p) => (
          <Link key={p.code || p.productCode} href={`/products/${encodeURIComponent(p.code || p.productCode)}`} className="border rounded p-3 hover:shadow">
            <div className="font-medium">{p.name || p.productName || p.code}</div>
            <div className="text-sm text-gray-600">{p.description || ''}</div>
            <div className="mt-2 font-semibold">${Number(p.price || p.msrp || 0).toFixed(2)}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
