'use client';

import { addToCart } from '@/lib/cart';

export default function AddToCartButton({ product }) {
  function handleClick() {
    try {
      addToCart(product, 1);
      // lightweight feedback; could be replaced by toast
      alert('Added to cart');
    } catch (e) {
      alert('Failed to add to cart: ' + (e?.message || String(e)));
    }
  }

  return (
    <button
      className="mt-4 px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition"
      onClick={handleClick}
    >
      Add to Cart
    </button>
  );
}
