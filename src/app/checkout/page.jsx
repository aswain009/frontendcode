'use client';

import { useEffect, useState } from 'react';
import { getCart, clearCart } from '@/lib/cart';
//import { updateProduct, createOrder } from '@/lib/api';
import { createOrder } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState({ items: [], subtotal: 0 });
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
  });
  const [status, setStatus] = useState({ loading: false, error: null });

  useEffect(() => {
    setCart(getCart());
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    //Call updateProduct API to update inventory for each item in cart.
    //Validate inventory before placing order.
    //Provide feedback to user if inventory is insufficient.
    //Maybe provide alternative items? Maybe not? Not sure on the lift for that.

    //Call createOrder API to create the order.
    //Provide feedback to user if order creation fails.
    //If order creation fails for any reason, the cart should NOT be cleared and the user should be able to try again.
    //If the order is successfully created, the cart should be cleared and the user should be redirected to the order confirmation page/Order Conformation deatials should be displayed to the user.

    //Confirm order creation API data.

    if (cart.items.length === 0) {
      setStatus({ loading: false, error: 'Your cart is empty.' });
      return;
    }
    setStatus({ loading: true, error: null });
    try {
      const today = new Date().toISOString().slice(0, 10);
      const orderPayload = {
        orderNumber: 0,
        orderDate: today,
        requiredDate: today,
        shippedDate: today,
        status: 'Submitted',
        comments: '',
        customer: {
          customerNumber: 0,
          customerName: `${form.firstName} ${form.lastName}`.trim(),
          contactLastName: form.lastName,
          contactFirstName: form.firstName,
          phone: form.phone || '',
          addressLine1: form.address,
          addressLine2: '',
          city: form.city,
          state: form.state,
          postalCode: form.postalCode,
          country: '',
          salesRep: {
            employeeNumber: 0,
            lastName: '',
            firstName: '',
            extension: '',
            email: form.email || '',
            office: {
              officeCode: '',
              city: '',
              phone: '',
              addressLine1: '',
              addressLine2: '',
              state: '',
              country: '',
              postalCode: '',
              territory: ''
            },
            reportsTo: '',
            jobTitle: ''
          },
          creditLimit: 0
        }
      };
      const created = await createOrder(orderPayload);
      // Try to derive orderNumber from response
      const orderNumber = created?.orderNumber || created?.id || created?.orderNo;
      clearCart();
      if (orderNumber) {
        router.push(`/order-confirmation/${encodeURIComponent(orderNumber)}`);
      } else {
        // if API doesn't return a number, go to orders list page alternative
        router.push('/order-confirmation/unknown');
      }
    } catch (err) {
      setStatus({ loading: false, error: err.message || 'Failed to place order' });
      return;
    }
  }

  function setField(k, v) {
    setForm(prev => ({ ...prev, [k]: v }));
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Checkout</h1>
      {cart.items.length === 0 ? (
        <div>Your cart is empty.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <form onSubmit={onSubmit} className="md:col-span-2 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input className="border rounded px-3 py-2" placeholder="First name" value={form.firstName} onChange={e => setField('firstName', e.target.value)} required />
              <input className="border rounded px-3 py-2" placeholder="Last name" value={form.lastName} onChange={e => setField('lastName', e.target.value)} required />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input type="email" className="border rounded px-3 py-2" placeholder="Email" value={form.email} onChange={e => setField('email', e.target.value)} required />
              <input className="border rounded px-3 py-2" placeholder="Phone" value={form.phone} onChange={e => setField('phone', e.target.value)} />
            </div>
            <input className="border rounded px-3 py-2 w-full" placeholder="Address" value={form.address} onChange={e => setField('address', e.target.value)} required />
            <div className="grid grid-cols-3 gap-3">
              <input className="border rounded px-3 py-2" placeholder="City" value={form.city} onChange={e => setField('city', e.target.value)} required />
              <input className="border rounded px-3 py-2" placeholder="State" value={form.state} onChange={e => setField('state', e.target.value)} required />
              <input className="border rounded px-3 py-2" placeholder="Postal Code" value={form.postalCode} onChange={e => setField('postalCode', e.target.value)} required />
            </div>
            {status.error && <div className="text-red-600 text-sm">{status.error}</div>}
            <button disabled={status.loading} className="bg-blue-600 text-white px-4 py-2 rounded">
              {status.loading ? 'Placing order...' : 'Place Order'}
            </button>
          </form>
          <div className="border rounded p-4">
            <h2 className="font-semibold mb-2">Order Summary</h2>
            <ul className="space-y-2">
              {cart.items.map(it => (
                <li key={it.code} className="flex items-center justify-between text-sm">
                  <span>{it.name} × {it.quantity}</span>
                  <span>${(it.price * it.quantity).toFixed(2)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 text-right font-semibold">Subtotal: ${cart.subtotal.toFixed(2)}</div>
          </div>
        </div>
      )}
    </div>
  );
}
