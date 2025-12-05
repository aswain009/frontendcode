'use client';

import { useEffect, useMemo, useState } from 'react';
import { getOrder, getCustomers, updateOrder } from '@/lib/api';
import { loadEmployees } from '@/lib/employees';
import { useParams } from 'next/navigation';

export default function EditOrderPage() {
  const params = useParams();
  const orderParam = params?.orderNumber;
  const orderNumber = Number(Array.isArray(orderParam) ? orderParam[0] : orderParam);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Order fields
  const [orderDate, setOrderDate] = useState('');
  const [requiredDate, setRequiredDate] = useState('');
  const [shippedDate, setShippedDate] = useState('');
  const [status, setStatus] = useState('');
  const [comments, setComments] = useState('');

  const [customers, setCustomers] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [customersError, setCustomersError] = useState(null);
  const [selectedCustomerNumber, setSelectedCustomerNumber] = useState('');

  const [employees, setEmployees] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [employeesError, setEmployeesError] = useState(null);
  const [selectedRepId, setSelectedRepId] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setCustomersLoading(true);
        setEmployeesLoading(true);
        const [ord, custs, emps] = await Promise.all([
          getOrder(orderNumber),
          getCustomers(),
          loadEmployees(),
        ]);
        if (cancelled) return;
        setCustomers(Array.isArray(custs) ? custs : []);
        setEmployees(Array.isArray(emps) ? emps : []);

        // Initialize order fields
        const toDate = (v) => (v ? String(v).slice(0, 10) : '');
        setOrderDate(toDate(ord?.orderDate));
        setRequiredDate(toDate(ord?.requiredDate));
        setShippedDate(toDate(ord?.shippedDate));
        setStatus(ord?.status || '');
        setComments(ord?.comments || '');

        // Initialize selected customer and rep
        const custNum = ord?.customer?.customerNumber ?? ord?.customer?.id;
        if (custNum) setSelectedCustomerNumber(String(custNum));
        const repNum = ord?.customer?.salesRep?.employeeNumber;
        if (repNum) setSelectedRepId(String(repNum));

      } catch (e) {
        if (!cancelled) setError(e?.message || 'Failed to load order');
      } finally {
        if (!cancelled) {
          setLoading(false);
          setCustomersLoading(false);
          setEmployeesLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [orderNumber]);

  // When customer changes, auto-select their sales rep if available
  useEffect(() => {
    const num = Number(selectedCustomerNumber);
    if (!num) return;
    const cust = customers.find(c => Number(c.customerNumber ?? c.id) === num);
    if (cust?.salesRep?.employeeNumber) {
      setSelectedRepId(String(cust.salesRep.employeeNumber));
    }
  }, [selectedCustomerNumber, customers]);

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
    setError(null);
    setSuccess(null);

    // Validate order number and selections
    if (!Number.isFinite(orderNumber)) {
      setError('Invalid order number.');
      return;
    }

    const custNum = Number(selectedCustomerNumber);
    const selectedCustomer = customers.find(c => Number(c.customerNumber ?? c.id) === custNum);
    if (!selectedCustomer) {
      setError('Please select a customer.');
      return;
    }

    const repIdNum = Number(selectedRepId);
    const fallbackRep = selectedCustomer?.salesRep;
    const selectedRep = employees.find(e => Number(e.employeeNumber) === repIdNum) || fallbackRep;
    if (!selectedRep) {
      setError('Please select a sales rep.');
      return;
    }

    setSaving(true);
    try {
      const repOffice = selectedRep.office || {};
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

      const payload = {
        orderNumber: orderNumber,
        orderDate: orderDate || new Date().toISOString().slice(0, 10),
        requiredDate: requiredDate || orderDate || new Date().toISOString().slice(0, 10),
        shippedDate: shippedDate || orderDate || new Date().toISOString().slice(0, 10),
        status: status || 'Submitted',
        comments: comments || '',
        customer: customerPayload,
      };

      await updateOrder(orderNumber, payload);
      setSuccess('Order updated successfully.');
    } catch (e) {
      setError(e?.message || 'Failed to update order');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Edit Order #{orderNumber}</h1>
      </div>

      {error && <div className="text-red-600 font-semibold text-base">{error}</div>}
      {success && <div className="text-green-700 font-semibold text-base">{success}</div>}

      <form onSubmit={onSubmit} className="space-y-6 max-w-3xl">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Order Date</label>
            <input type="date" className="border rounded px-3 py-2 w-full" value={orderDate} onChange={e => setOrderDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Required Date</label>
            <input type="date" className="border rounded px-3 py-2 w-full" value={requiredDate} onChange={e => setRequiredDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Shipped Date</label>
            <input type="date" className="border rounded px-3 py-2 w-full" value={shippedDate} onChange={e => setShippedDate(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <input className="border rounded px-3 py-2 w-full" value={status} onChange={e => setStatus(e.target.value)} placeholder="e.g., Submitted, Shipped, Cancelled" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Comments</label>
            <input className="border rounded px-3 py-2 w-full" value={comments} onChange={e => setComments(e.target.value)} />
          </div>
        </div>

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
            <div className="text-yellow-700 text-xs mt-1">Customers list is empty. Ensure NEXT_PUBLIC_API_BASE is set and CORS allows the request.</div>
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

        <div className="flex items-center gap-2">
          <button disabled={saving} className="bg-[color:var(--brand-teal)] text-white px-4 py-2 rounded">{saving ? 'Saving...' : 'Save Changes'}</button>
          <button type="button" onClick={() => history.back()} className="px-4 py-2 border rounded">Cancel</button>
        </div>
      </form>
    </div>
  );
}
