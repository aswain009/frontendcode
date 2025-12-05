'use client';

import { useEffect, useState } from 'react';
import { getCart, clearCart } from '@/lib/cart';
//import { updateProduct, createOrder } from '@/lib/api';
import { createOrder, getEmployees, API_BASE } from '@/lib/api';
import { useRouter } from 'next/navigation';

function serializeError(err) {
  if (!err) return null;
  const base = {
    name: err.name,
    message: err.message,
    stack: err.stack,
  };
  // include custom fields from safeFetch
  const extras = {};
  for (const k of ['status','statusText','url','method','requestHeaders','requestBody','responseHeaders','responseText','responseJson','startedAt','durationMs']) {
    if (err[k] !== undefined) extras[k] = err[k];
  }
  return { ...base, ...extras };
}

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
  const [employees, setEmployees] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [employeesError, setEmployeesError] = useState(null);
  const [selectedRepId, setSelectedRepId] = useState('');
  const [debug, setDebug] = useState({ request: null, response: null, error: null });

  useEffect(() => {
    setCart(getCart());
  }, []);

  useEffect(() => {
    async function loadEmployees() {
      setEmployeesLoading(true);
      setEmployeesError(null);
      try {
        const list = await getEmployees();
        // Expect array of employees with employeeNumber, firstName, lastName
        setEmployees(Array.isArray(list) ? list : []);
      } catch (e) {
        console.error('Failed to load employees', e);
        setEmployeesError('Failed to load sales reps');
      } finally {
        setEmployeesLoading(false);
      }
    }
    loadEmployees();
  }, []);

  // Ensure salesRep.reportsTo is sent as an Employee object (not a number)
  function normalizeReportsTo(value) {
    if (!value && value !== 0) return null;
    if (typeof value === 'object' && value !== null) {
      // If it's already an object and has an employeeNumber, pass through
      if ('employeeNumber' in value) return value;
      // Try to coerce if it's something like { id: 123 }
      if ('id' in value && typeof value.id === 'number') return { employeeNumber: Number(value.id) };
      return null;
    }
    const num = Number(value);
    return Number.isFinite(num) && num > 0 ? { employeeNumber: num } : null;
  }

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
      const newOrderNumber = Math.max(1, Math.floor(Date.now() % 2147483647));

      // Validate Sales Rep selection
      const repIdNum = Number(selectedRepId);
      const selectedRep = employees.find(e => Number(e.employeeNumber) === repIdNum);
      if (!selectedRep) {
        setStatus({ loading: false, error: 'Please select a sales rep before placing the order.' });
        return;
      }

      const repOffice = selectedRep.office || {};

      const orderPayload = {
        orderNumber: newOrderNumber,
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
            employeeNumber: selectedRep.employeeNumber || 0,
            lastName: selectedRep.lastName || '',
            firstName: selectedRep.firstName || '',
            extension: selectedRep.extension || '',
            email: selectedRep.email || '',
            office: {
              officeCode: repOffice.officeCode || '',
              city: repOffice.city || '',
              phone: repOffice.phone || '',
              addressLine1: repOffice.addressLine1 || '',
              addressLine2: repOffice.addressLine2 || '',
              state: repOffice.state || '',
              country: repOffice.country || '',
              postalCode: repOffice.postalCode || '',
              territory: repOffice.territory || ''
            },
            reportsTo: normalizeReportsTo(selectedRep.reportsTo),
            jobTitle: selectedRep.jobTitle || ''
          },
          creditLimit: 0
        }
      };
      console.log('[Checkout] Placing order to', `${API_BASE}/orders`);
      console.log('[Checkout] Request payload:', orderPayload);
      setDebug(d => ({ ...d, request: orderPayload, response: null, error: null }));
      const created = await createOrder(orderPayload);
      console.log('[Checkout] createOrder response:', created);
      // Try to derive orderNumber from response
      const orderNumber = created?.orderNumber || created?.id || created?.orderNo || orderPayload.orderNumber;
      setDebug(d => ({ ...d, response: created }));
      clearCart();
      if (orderNumber) {
        router.push(`/order-confirmation/${encodeURIComponent(orderNumber)}`);
      } else {
        // if API doesn't return a number, go to orders list page alternative
        router.push('/order-confirmation/unknown');
      }
    } catch (err) {
      console.error('[Checkout] createOrder failed:', err);
      setDebug(d => ({ ...d, error: serializeError(err) }));
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

            <div>
              <label className="block text-sm font-medium mb-1">Sales Rep</label>
              <select
                className="border rounded px-3 py-2 w-full"
                value={selectedRepId}
                onChange={e => setSelectedRepId(e.target.value)}
                required
                disabled={employeesLoading}
              >
                <option value="" disabled>{employeesLoading ? 'Loading sales reps...' : 'Select a sales rep'}</option>
                {!employeesLoading && employees.map(emp => (
                  <option key={emp.employeeNumber} value={emp.employeeNumber}>
                    {(emp.firstName || '') + ' ' + (emp.lastName || '')} {emp.jobTitle ? `- ${emp.jobTitle}` : ''}
                  </option>
                ))}
              </select>
              {employeesError && <div className="text-yellow-700 text-xs mt-1">{employeesError}</div>}
            </div>

            {status.error && <div className="text-red-600 text-sm">{status.error}</div>}
            <button disabled={status.loading || employeesLoading} className="bg-blue-600 text-white px-4 py-2 rounded">
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

      <details className="mt-6 border rounded">
        <summary className="px-3 py-2 cursor-pointer select-none">Debug: Create Order</summary>
        <div className="p-3 space-y-2 text-xs">
          <div><strong>API Base:</strong> {API_BASE}</div>
          <div>
            <strong>Last Request Body:</strong>
            <pre className="whitespace-pre-wrap break-all bg-gray-50 p-2 rounded border">{JSON.stringify(debug.request, null, 2) || '—'}</pre>
          </div>
          <div>
            <strong>Last Response:</strong>
            <pre className="whitespace-pre-wrap break-all bg-gray-50 p-2 rounded border">{JSON.stringify(debug.response, null, 2) || '—'}</pre>
          </div>
          <div>
            <strong>Last Error:</strong>
            <pre className="whitespace-pre-wrap break-all bg-gray-50 p-2 rounded border">{JSON.stringify(debug.error, null, 2) || '—'}</pre>
          </div>
        </div>
      </details>
    </div>
  );
}
