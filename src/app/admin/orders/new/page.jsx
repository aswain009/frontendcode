'use client';

import { useEffect, useMemo, useState } from 'react';
import { createCustomer, createOrder, getCustomers, getProducts, API_BASE } from '@/lib/api';
import { useRouter } from 'next/navigation';

function serializeError(err) {
  if (!err) return null;
  const base = { name: err.name, message: err.message, stack: err.stack };
  const extras = {};
  for (const k of ['status','statusText','url','method','requestHeaders','requestBody','responseHeaders','responseText','responseJson','startedAt','durationMs']) {
    if (err[k] !== undefined) extras[k] = err[k];
  }
  return { ...base, ...extras };
}

export default function NewOrderPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState({ loading: true, saving: false, error: null });
  const [debug, setDebug] = useState({ request: null, response: null, error: null });

  const [useExistingCustomer, setUseExistingCustomer] = useState(true);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerForm, setCustomerForm] = useState({ firstName: '', lastName: '', email: '', phone: '' });

  const [items, setItems] = useState([{ productCode: '', quantity: 1 }]);

  useEffect(() => {
    (async () => {
      try {
        const [cs, ps] = await Promise.all([getCustomers(), getProducts()]);
        setCustomers(cs || []);
        setProducts(ps || []);
        setStatus(s => ({ ...s, loading: false }));
      } catch (e) {
        setStatus({ loading: false, saving: false, error: e.message || 'Failed to load data' });
      }
    })();
  }, []);

  function setItem(index, patch) {
    setItems(prev => prev.map((it, i) => i === index ? { ...it, ...patch } : it));
  }
  function addItem() { setItems(prev => [...prev, { productCode: '', quantity: 1 }]); }
  function removeItem(index) { setItems(prev => prev.filter((_, i) => i !== index)); }

  const productsByCode = useMemo(() => {
    const map = new Map();
    (products || []).forEach(p => { map.set(p.code || p.productCode, p); });
    return map;
  }, [products]);

  const computedItems = useMemo(() => {
    return items.map(it => {
      const p = productsByCode.get(it.productCode);
      const price = Number(p?.price ?? p?.msrp ?? 0);
      return { ...it, price, name: p?.name || p?.productName || it.productCode };
    });
  }, [items, productsByCode]);

  const subtotal = computedItems.reduce((sum, it) => sum + (Number(it.price) * Number(it.quantity || 0)), 0);

  async function onSubmit(e) {
    e.preventDefault();
    if (computedItems.length === 0 || computedItems.some(it => !it.productCode)) {
      setStatus(s => ({ ...s, error: 'Please select at least one product.' }));
      return;
    }
    setStatus(s => ({ ...s, saving: true, error: null }));
    try {
      let customerId = selectedCustomerId;
      let customerObj = null;
      if (!useExistingCustomer) {
        // create a customer first (minimal fields)
        const created = await createCustomer(customerForm);
        customerId = created?.id;
        customerObj = created;
      }

      const orderPayload = {
        customerId,
        customer: customerObj || undefined,
        items: computedItems.map(it => ({ productCode: it.productCode, quantity: Number(it.quantity), price: it.price })),
        subtotal,
        source: 'admin',
      };
      console.log('[Admin/NewOrder] Placing order to', `${API_BASE}/orders`);
      console.log('[Admin/NewOrder] Request payload:', orderPayload);
      setDebug(d => ({ ...d, request: orderPayload, response: null, error: null }));
      const res = await createOrder(orderPayload);
      console.log('[Admin/NewOrder] createOrder response:', res);
      const orderNumber = res?.orderNumber || res?.id || res?.orderNo;
      setDebug(d => ({ ...d, response: res }));
      router.push('/admin/orders');
      router.refresh?.();
      // Optionally redirect to the newly created order confirmation page:
      // if (orderNumber) router.push(`/order-confirmation/${encodeURIComponent(orderNumber)}`);
    } catch (e) {
      console.error('[Admin/NewOrder] createOrder failed:', e);
      setDebug(d => ({ ...d, error: serializeError(e) }));
      setStatus(s => ({ ...s, saving: false, error: e.message || 'Failed to create order' }));
    }
  }

  if (status.loading) return <div>Loading...</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">New Order</h1>
      {status.error && <div className="text-red-600 text-sm">{status.error}</div>}
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="custmode" checked={useExistingCustomer} onChange={() => setUseExistingCustomer(true)} /> Existing customer
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="custmode" checked={!useExistingCustomer} onChange={() => setUseExistingCustomer(false)} /> New customer
            </label>
          </div>
          {useExistingCustomer ? (
            <select className="border rounded px-3 py-2 w-full" value={selectedCustomerId} onChange={e => setSelectedCustomerId(e.target.value)} required>
              <option value="">Select a customer…</option>
              {(customers || []).map(c => (
                <option key={c.id} value={c.id}>{[c.firstName, c.lastName].filter(Boolean).join(' ') || c.name || c.email || c.id}</option>
              ))}
            </select>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input className="border rounded px-3 py-2" placeholder="First name" value={customerForm.firstName} onChange={e => setCustomerForm(prev => ({ ...prev, firstName: e.target.value }))} required />
              <input className="border rounded px-3 py-2" placeholder="Last name" value={customerForm.lastName} onChange={e => setCustomerForm(prev => ({ ...prev, lastName: e.target.value }))} required />
              <input type="email" className="border rounded px-3 py-2" placeholder="Email" value={customerForm.email} onChange={e => setCustomerForm(prev => ({ ...prev, email: e.target.value }))} />
              <input className="border rounded px-3 py-2" placeholder="Phone" value={customerForm.phone} onChange={e => setCustomerForm(prev => ({ ...prev, phone: e.target.value }))} />
            </div>
          )}
        </div>

        <div className="space-y-3">
          <h2 className="font-semibold">Items</h2>
          {items.map((it, idx) => (
            <div key={idx} className="grid grid-cols-1 sm:grid-cols-6 gap-3 items-center">
              <div className="sm:col-span-3">
                <select className="border rounded px-3 py-2 w-full" value={it.productCode} onChange={e => setItem(idx, { productCode: e.target.value })} required>
                  <option value="">Select a product…</option>
                  {(products || []).map(p => {
                    const code = p.code || p.productCode;
                    const name = p.name || p.productName || code;
                    return <option key={code} value={code}>{name} ({code})</option>;
                  })}
                </select>
              </div>
              <div>
                <input type="number" min={1} className="border rounded px-3 py-2 w-full" value={it.quantity} onChange={e => setItem(idx, { quantity: Number(e.target.value) })} />
              </div>
              <div className="sm:col-span-2 text-sm text-gray-700">
                {(() => {
                  const p = productsByCode.get(it.productCode);
                  const price = Number(p?.price ?? p?.msrp ?? 0);
                  return <div>{p ? <>${price.toFixed(2)} × {it.quantity} = <strong>${(price * (it.quantity || 0)).toFixed(2)}</strong></> : '—'}</div>;
                })()}
              </div>
              <div>
                <button type="button" onClick={() => removeItem(idx)} className="text-red-700 underline">Remove</button>
              </div>
            </div>
          ))}
          <button type="button" onClick={addItem} className="text-sm underline">+ Add item</button>
        </div>

        <div className="text-right font-semibold">Subtotal: ${subtotal.toFixed(2)}</div>

        <div className="flex items-center gap-2">
          <button disabled={status.saving} className="bg-[color:var(--brand-teal)] text-white px-4 py-2 rounded">{status.saving ? 'Creating...' : 'Create Order'}</button>
          <button type="button" onClick={() => history.back()} className="px-4 py-2 border rounded">Cancel</button>
        </div>
      </form>

      <details className="mt-6 border rounded">
        <summary className="px-3 py-2 cursor-pointer select-none">Debug: Create Order (Admin)</summary>
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
