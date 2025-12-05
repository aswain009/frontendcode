'use client';

import { useEffect, useMemo, useState } from 'react';
import { createOrder, getCustomers, getProducts } from '@/lib/api';
import { loadEmployees } from '@/lib/employees';
import { useRouter } from 'next/navigation';

export default function NewOrderPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [customersError, setCustomersError] = useState(null);

  const [employees, setEmployees] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [employeesError, setEmployeesError] = useState(null);

  const [products, setProducts] = useState([]);

  const [status, setStatus] = useState({ loading: true, saving: false, error: null, success: null, orderNumber: null });

  const [selectedCustomerNumber, setSelectedCustomerNumber] = useState('');
  const [selectedRepId, setSelectedRepId] = useState('');

  const [items, setItems] = useState([{ productCode: '', quantity: 1 }]);

  useEffect(() => {
    (async () => {
      try {
        setCustomersLoading(true);
        setEmployeesLoading(true);
        const [cs, ps, emps] = await Promise.all([getCustomers(), getProducts(), loadEmployees()]);
        setCustomers(Array.isArray(cs) ? cs : []);
        setProducts(ps || []);
        setEmployees(Array.isArray(emps) ? emps : []);
        setStatus(s => ({ ...s, loading: false }));
      } catch (e) {
        setStatus({ loading: false, saving: false, error: e.message || 'Failed to load data', success: null, orderNumber: null });
        setCustomersError('Failed to load customers');
        setEmployeesError('Failed to load sales reps');
      } finally {
        setCustomersLoading(false);
        setEmployeesLoading(false);
      }
    })();
  }, []);

  // Auto-pick sales rep when customer changes
  useEffect(() => {
    const custNum = Number(selectedCustomerNumber);
    if (!custNum) return;
    const cust = customers.find(c => Number(c.customerNumber ?? c.id) === custNum);
    if (cust?.salesRep?.employeeNumber) {
      setSelectedRepId(String(cust.salesRep.employeeNumber));
    }
  }, [selectedCustomerNumber, customers]);

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

  function normalizeReportsTo(value) {
    if (!value && value !== 0) return null;
    if (typeof value === 'object' && value !== null) {
      if ('employeeNumber' in value) return value;
      if ('id' in value && typeof value.id === 'number') return { employeeNumber: Number(value.id) };
      return null;
    }
    const num = Number(value);
    return Number.isFinite(num) && num > 0 ? { employeeNumber: num } : null;
  }

  async function onSubmit(e) {
    e.preventDefault();
    // Optional: enforce at least one item chosen if you want items to be relevant
    if (computedItems.length === 0 || computedItems.some(it => !it.productCode)) {
      setStatus(s => ({ ...s, error: 'Please select at least one product.' }));
      return;
    }

    // Validate customer selection
    const custNum = Number(selectedCustomerNumber);
    const selectedCustomer = customers.find(c => Number(c.customerNumber ?? c.id) === custNum);
    if (!selectedCustomer) {
      setStatus(s => ({ ...s, error: 'Please select a customer.' }));
      return;
    }

    // Validate/prepare Sales Rep
    const repIdNum = Number(selectedRepId);
    const fallbackRep = selectedCustomer?.salesRep;
    const selectedRep = employees.find(e => Number(e.employeeNumber) === repIdNum) || fallbackRep;
    if (!selectedRep) {
      setStatus(s => ({ ...s, error: 'Please select a sales rep.' }));
      return;
    }

    setStatus(s => ({ ...s, saving: true, error: null, success: null, orderNumber: null }));
    try {
      const today = new Date().toISOString().slice(0, 10);
      const newOrderNumber = Math.max(1, Math.floor(Date.now() % 2147483647));

      const repOffice = (selectedRep.office) || {};
      const customerPayload = JSON.parse(JSON.stringify(selectedCustomer));
      customerPayload.salesRep = {
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
          addressLine2: repOffice.addressLine2 ?? '',
          state: repOffice.state ?? '',
          country: repOffice.country || '',
          postalCode: repOffice.postalCode || '',
          territory: repOffice.territory || ''
        },
        reportsTo: normalizeReportsTo(selectedRep.reportsTo),
        jobTitle: selectedRep.jobTitle || ''
      };

      const orderPayload = {
        orderNumber: newOrderNumber,
        orderDate: today,
        requiredDate: today,
        shippedDate: today,
        status: 'Submitted',
        comments: '',
        customer: customerPayload
      };

      const created = await createOrder(orderPayload);
      const orderNumber = created?.orderNumber || created?.id || created?.orderNo || orderPayload.orderNumber;

      setStatus(s => ({ ...s, saving: false, success: 'Order created successfully.', error: null, orderNumber }));
      // Do not redirect per requirement
    } catch (e) {
      setStatus(s => ({ ...s, saving: false, error: e?.message || 'Failed to create order', success: null }));
    }
  }

  if (status.loading) return <div>Loading...</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">New Order</h1>
      {status.error && <div className="text-red-600 text-sm">{status.error}</div>}
      {status.success && (
        <div className="text-green-700 text-sm">{status.success} {status.orderNumber ? `#${status.orderNumber}` : ''}</div>
      )}
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium mb-1">Customer</label>
          <select
            className="border rounded px-3 py-2 w-full"
            value={selectedCustomerNumber}
            onChange={e => setSelectedCustomerNumber(e.target.value)}
            required
            disabled={customersLoading || (Array.isArray(customers) && customers.length === 0)}
          >
            <option value="" disabled>
              {customersLoading ? 'Loading customers...' : (Array.isArray(customers) && customers.length === 0 ? 'No customers found. Check API_BASE config.' : 'Select a customer')}
            </option>
            {!customersLoading && (customers || []).map(c => (
              <option key={c.customerNumber ?? c.id} value={c.customerNumber ?? c.id}>
                {(c.customerName || [c.contactFirstName, c.contactLastName].filter(Boolean).join(' ') || 'Customer')} {(c.customerNumber ?? c.id) ? `(#${c.customerNumber ?? c.id})` : ''}
              </option>
            ))}
          </select>
          {customersError && <div className="text-yellow-700 text-xs mt-1">{customersError}</div>}
          {!customersError && !customersLoading && Array.isArray(customers) && customers.length === 0 && (
            <div className="text-yellow-700 text-xs mt-1">Customers list is empty. Ensure NEXT_PUBLIC_API_BASE is set for production and CORS allows the request.</div>
          )}
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
            {!employeesLoading && (employees || []).map(emp => (
              <option key={emp.employeeNumber} value={emp.employeeNumber}>
                {(emp.firstName || '') + ' ' + (emp.lastName || '')} {emp.jobTitle ? `- ${emp.jobTitle}` : ''}
              </option>
            ))}
          </select>
          {employeesError && <div className="text-yellow-700 text-xs mt-1">{employeesError}</div>}
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

    </div>
  );
}
