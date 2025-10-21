import Link from 'next/link';
import { getProducts } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function SearchPage({ searchParams }) {
  const sp = await searchParams;
  const q = (sp?.q || '').toString().toLowerCase();
  let products = [];
  let error = null;
  try {
    products = await getProducts();
  } catch (e) {
    error = e.message;
  }

  const filtered = (products || []).filter((p) => {
    if (!q) return true;
    const text = `${p.name || p.productName || ''} ${p.description || ''} ${(p.code || p.productCode || '')}`.toLowerCase();
    return text.includes(q);
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Search</h1>
      <p className="text-sm text-gray-600">{q ? `Results for "${q}"` : 'Showing all products'}</p>
      {error && <p className="text-red-600">Failed to load products: {String(error)}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {filtered.map((p) => (
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
