import Link from 'next/link';
import { getOrder, getOrderDetails } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function OrderConfirmationPage({ params }) {
  const { orderNumber } = await params;
  let order = null;
  let details = [];
  let error = null;
  try {
    if (orderNumber !== 'unknown') {
      order = await getOrder(orderNumber);
      try {
        details = await getOrderDetails(orderNumber);
      } catch {
        details = [];
      }
    }
  } catch (e) {
    error = e.message;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Thank you for your order!</h1>
      {orderNumber && <p>Your order number: <span className="font-mono">{orderNumber}</span></p>}
      {error && <p className="text-red-600">Failed to load order: {String(error)}</p>}

      {order && (
        <div className="border rounded p-4">
          <h2 className="font-semibold mb-2">Order Summary</h2>
          <div className="text-sm text-gray-700">Date: {order.orderDate || order.createdAt || ''}</div>
          <div className="text-sm text-gray-700">Status: {order.status || 'Submitted'}</div>
        </div>
      )}

      {details && details.length > 0 && (
        <div className="border rounded p-4">
          <h3 className="font-semibold mb-2">Items</h3>
          <ul className="space-y-1 text-sm">
            {details.map((d, idx) => (
              <li key={idx} className="flex items-center justify-between">
                <span>{d.productName || d.productCode}</span>
                <span>Qty: {d.quantity} × ${Number(d.price || d.unitPrice || 0).toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <Link href="/products" className="underline">Continue shopping</Link>
      </div>
    </div>
  );
}
