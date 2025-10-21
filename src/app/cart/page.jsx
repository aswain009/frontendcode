'use client';

import Link from 'next/link';
import { getCart, updateQuantity, removeFromCart, clearCart } from '@/lib/cart';
import { useEffect, useState } from 'react';

export default function CartPage() {
  const [cart, setCart] = useState({ items: [], subtotal: 0 });

  useEffect(() => {
    setCart(getCart());
  }, []);

  function onQtyChange(code, qty) {
    setCart(updateQuantity(code, Number(qty)));
  }
  function onRemove(code) {
    setCart(removeFromCart(code));
  }
  function onClear() {
    setCart(clearCart());
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Your Cart</h1>
      {cart.items.length === 0 ? (
        <div className="text-gray-600">Your cart is empty. <Link href="/products" className="underline">Browse products</Link>.</div>
      ) : (
        <>
          <table className="w-full text-sm border rounded">
            <thead>
              <tr className="bg-gray-100">
                <th className="text-left p-2">Product</th>
                <th className="text-left p-2">Price</th>
                <th className="text-left p-2">Qty</th>
                <th className="text-left p-2">Total</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {cart.items.map(item => (
                <tr key={item.code} className="border-t">
                  <td className="p-2">{item.name} <span className="text-gray-500">({item.code})</span></td>
                  <td className="p-2">${Number(item.price).toFixed(2)}</td>
                  <td className="p-2">
                    <input type="number" min={1} value={item.quantity} onChange={e => onQtyChange(item.code, e.target.value)} className="w-16 border rounded px-2 py-1" />
                  </td>
                  <td className="p-2">${(Number(item.price) * Number(item.quantity)).toFixed(2)}</td>
                  <td className="p-2 text-right">
                    <button onClick={() => onRemove(item.code)} className="text-red-600 underline">Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center justify-between">
            <button onClick={onClear} className="text-sm underline">Clear cart</button>
            <div className="text-xl font-semibold">Subtotal: ${Number(cart.subtotal).toFixed(2)}</div>
          </div>
          <div className="text-right">
            <Link href="/checkout" className="inline-block bg-blue-600 text-white px-4 py-2 rounded">Proceed to Checkout</Link>
          </div>
        </>
      )}
    </div>
  );
}
