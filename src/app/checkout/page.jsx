'use client';

import { useEffect, useState } from 'react';
import { getCart, clearCart } from '@/lib/cart';
//import { updateProduct, createOrder } from '@/lib/api';
import { createOrder, getCustomers } from '@/lib/api';
import { loadEmployees } from '@/lib/employees';
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
  const [employees, setEmployees] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [employeesError, setEmployeesError] = useState(null);
  const [selectedRepId, setSelectedRepId] = useState('');

  const [customers, setCustomers] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [customersError, setCustomersError] = useState(null);
  const [selectedCustomerNumber, setSelectedCustomerNumber] = useState('');


  useEffect(() => {
    setCart(getCart());
  }, []);

  useEffect(() => {
    async function loadSalesReps() {
      setEmployeesLoading(true);
      setEmployeesError(null);
      try {
        const list = await loadEmployees();
        setEmployees(Array.isArray(list) ? list : []);
      } catch (e) {
        setEmployeesError('Failed to load sales reps');
      } finally {
        setEmployeesLoading(false);
      }
    }
    async function loadCustomers() {
      setCustomersLoading(true);
      setCustomersError(null);
      try {
        const list = await getCustomers();
        setCustomers(Array.isArray(list) ? list : []);
      } catch (e) {
        console.error('Failed to load customers', e);
        setCustomersError('Failed to load customers');
      } finally {
        setCustomersLoading(false);
      }
    }
    loadSalesReps();
    loadCustomers();
  }, []);

  // When customer selection changes, auto-select their sales rep if available
  useEffect(() => {
    const custNum = Number(selectedCustomerNumber);
    if (!custNum) return;
    const cust = customers.find(c => Number(c.customerNumber ?? c.id) === custNum);
    if (cust?.salesRep?.employeeNumber) {
      setSelectedRepId(String(cust.salesRep.employeeNumber));
    }
  }, [selectedCustomerNumber, customers]);

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
    if (cart.items.length === 0) {
      setStatus({ loading: false, error: 'Your cart is empty.' });
      return;
    }

    // Validate customer selection
    const custNum = Number(selectedCustomerNumber);
    const selectedCustomer = customers.find(c => Number(c.customerNumber ?? c.id) === custNum);
    if (!selectedCustomer) {
      setStatus({ loading: false, error: 'Please select a customer before placing the order.' });
      return;
    }

    setStatus({ loading: true, error: null });
    try {
      const today = new Date().toISOString().slice(0, 10);
      const newOrderNumber = Math.max(1, Math.floor(Date.now() % 2147483647));

      // Validate/prepare Sales Rep
      const repIdNum = Number(selectedRepId);
      const fallbackRep = selectedCustomer?.salesRep;
      const selectedRep = employees.find(e => Number(e.employeeNumber) === repIdNum) || fallbackRep;
      if (!selectedRep) {
        setStatus({ loading: false, error: 'Please select a sales rep before placing the order.' });
        return;
      }

      const repOffice = (selectedRep.office) || {};

      // Build customer payload from the selected customer object
      const customerPayload = JSON.parse(JSON.stringify(selectedCustomer));
      // Ensure salesRep matches the chosen rep and normalize reportsTo
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
      clearCart();
      if (orderNumber) {
        router.push(`/order-confirmation/${encodeURIComponent(orderNumber)}`);
      } else {
        router.push('/order-confirmation/unknown');
      }
    } catch (err) {
      setStatus({ loading: false, error: err?.message || 'Failed to place order' });
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
              <label className="block text-sm font-medium mb-1">Customer</label>
              <select
                className="border rounded px-3 py-2 w-full"
                value={selectedCustomerNumber}
                onChange={e => setSelectedCustomerNumber(e.target.value)}
                required
                disabled={customersLoading}
              >
                <option value="" disabled>{customersLoading ? 'Loading customers...' : 'Select a customer'}</option>
                {!customersLoading && customers.map(c => (
                  <option key={c.customerNumber ?? c.id} value={c.customerNumber ?? c.id}>
                    {(c.customerName || [c.contactFirstName, c.contactLastName].filter(Boolean).join(' ') || 'Customer')} {(c.customerNumber ?? c.id) ? `(#${c.customerNumber ?? c.id})` : ''}
                  </option>
                ))}
              </select>
              {customersError && <div className="text-yellow-700 text-xs mt-1">{customersError}</div>}
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

    </div>
  );
}
