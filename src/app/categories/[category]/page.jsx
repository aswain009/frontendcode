import Link from 'next/link';
import { getProducts } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function CategoryPage({ params }) {
  const { category } = await params;
  let products = [];
  let error = null;
  try {
    products = await getProducts();
  } catch (e) {
    error = e.message;
  }

  const filtered = (products || []).filter((p) => {
    const cat = (p.category || p.categoryName || '').toString().toLowerCase();
    return cat === decodeURIComponent(category).toLowerCase();
  });

  const hasCategoryField = (products || []).some(p => p.category || p.categoryName);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Category: {decodeURIComponent(category)}</h1>
      {error && <p className="text-red-600">Failed to load products: {String(error)}</p>}
      {!hasCategoryField && (
        <div className="p-3 border rounded bg-yellow-50 text-sm">
          Products do not expose a category field in the API response. Showing all products instead.
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {(hasCategoryField ? filtered : products).map((p) => (
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
