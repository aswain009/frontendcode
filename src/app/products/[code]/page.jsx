import { getProduct } from '@/lib/api';
import Link from 'next/link';
import AddToCartButton from '@/components/AddToCartButton';

export default async function ProductDetailPage({ params }) {
  const { code } = await params;
  let product = null;
  let error = null;
  try {
    product = await getProduct(code);
  } catch (e) {
    error = e.message;
  }

  if (error) {
    return <div>
      <h1 className="text-2xl font-semibold">Product</h1>
      <p className="text-red-600">Failed to load product: {String(error)}</p>
      <Link href="/products" className="underline">Back to products</Link>
    </div>;
  }

  if (!product) {
    return <div>Loading...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="border rounded p-4">
        <div className="aspect-video bg-gray-100 flex items-center justify-center text-gray-400">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.imageUrl} alt={product.name || product.productName} className="object-contain max-h-80" />
          ) : (
            <span>No image</span>
          )}
        </div>
      </div>
      <div>
        <h1 className="text-2xl font-semibold">{product.name || product.productName || product.code}</h1>
        <div className="text-gray-600">Code: {product.code}</div>
        {product.description && <p className="mt-2">{product.description}</p>}
        <div className="mt-4 text-2xl font-bold">${Number(product.price || product.msrp || 0).toFixed(2)}</div>
        <AddToCartButton product={product} />
        <div className="mt-4">
          <Link href="/cart" className="underline">Go to cart</Link>
        </div>
      </div>
    </div>
  );
}
