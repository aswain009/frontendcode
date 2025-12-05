'use client';

import { useEffect, useState } from 'react';
import { createCustomer } from '@/lib/api';
import { loadEmployees } from '@/lib/employees';
import { useRouter } from 'next/navigation';

export default function NewCustomerPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    addressLine2: '',
    customerName: '',
  });
  const [status, setStatus] = useState({ loading: false, error: null });

  const [employees, setEmployees] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [employeesError, setEmployeesError] = useState(null);
  const [selectedRepId, setSelectedRepId] = useState('');

  useEffect(() => {
    (async () => {
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
    })();
  }, []);

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

  function setField(k, v) { setForm(prev => ({ ...prev, [k]: v })); }

  async function onSubmit(e) {
    e.preventDefault();
    if (!selectedRepId) {
      setStatus({ loading: false, error: 'Please select a sales rep.' });
      return;
    }
    setStatus({ loading: true, error: null });
    try {
      const rep = employees.find(e => String(e.employeeNumber) === String(selectedRepId));
      if (!rep) throw new Error('Selected sales rep not found');
      const repOffice = rep.office || {};

      // Build Customer payload matching API schema
      const customerPayload = {
        // customerNumber is omitted on create; server to assign
        customerName: form.customerName || [form.firstName, form.lastName].filter(Boolean).join(' ').trim(),
        contactLastName: form.lastName || '',
        contactFirstName: form.firstName || '',
        phone: form.phone || '',
        addressLine1: form.address || '',
        addressLine2: form.addressLine2 || null,
        city: form.city || '',
        state: form.state || null,
        postalCode: form.postalCode || '',
        country: form.country || '',
        salesRep: {
          employeeNumber: rep.employeeNumber || 0,
          lastName: rep.lastName || '',
          firstName: rep.firstName || '',
          extension: rep.extension || '',
          email: rep.email || '',
          office: {
            officeCode: repOffice.officeCode || '',
            city: repOffice.city || '',
            phone: repOffice.phone || '',
            addressLine1: repOffice.addressLine1 || '',
            addressLine2: repOffice.addressLine2 ?? null,
            state: repOffice.state ?? null,
            country: repOffice.country || '',
            postalCode: repOffice.postalCode || '',
            territory: repOffice.territory || ''
          },
          reportsTo: normalizeReportsTo(rep.reportsTo),
          jobTitle: rep.jobTitle || ''
        },
        creditLimit: 0
      };

      await createCustomer(customerPayload);
      router.push('/admin/customers');
      router.refresh?.();
    } catch (err) {
      setStatus({ loading: false, error: err.message || 'Failed to create customer' });
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">New Customer</h1>
      <form onSubmit={onSubmit} className="space-y-3 max-w-2xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input className="border rounded px-3 py-2" placeholder="First name" value={form.firstName} onChange={e => setField('firstName', e.target.value)} required />
          <input className="border rounded px-3 py-2" placeholder="Last name" value={form.lastName} onChange={e => setField('lastName', e.target.value)} required />
        </div>
        <div>
          <input className="border rounded px-3 py-2 w-full" placeholder="Company / Customer name (optional)" value={form.customerName} onChange={e => setField('customerName', e.target.value)} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input type="email" className="border rounded px-3 py-2" placeholder="Email" value={form.email} onChange={e => setField('email', e.target.value)} />
          <input className="border rounded px-3 py-2" placeholder="Phone" value={form.phone} onChange={e => setField('phone', e.target.value)} />
        </div>
        <input className="border rounded px-3 py-2 w-full" placeholder="Address line 1" value={form.address} onChange={e => setField('address', e.target.value)} />
        <input className="border rounded px-3 py-2 w-full" placeholder="Address line 2 (optional)" value={form.addressLine2} onChange={e => setField('addressLine2', e.target.value)} />
        <div className="grid grid-cols-4 gap-3">
          <input className="border rounded px-3 py-2" placeholder="City" value={form.city} onChange={e => setField('city', e.target.value)} />
          <input className="border rounded px-3 py-2" placeholder="State" value={form.state} onChange={e => setField('state', e.target.value)} />
          <input className="border rounded px-3 py-2" placeholder="Postal Code" value={form.postalCode} onChange={e => setField('postalCode', e.target.value)} />
          <input className="border rounded px-3 py-2" placeholder="Country" value={form.country} onChange={e => setField('country', e.target.value)} />
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
        <div className="flex items-center gap-2">
          <button disabled={status.loading} className="bg-[color:var(--brand-teal)] text-white px-4 py-2 rounded">{status.loading ? 'Saving...' : 'Save Customer'}</button>
          <button type="button" onClick={() => history.back()} className="px-4 py-2 border rounded">Cancel</button>
        </div>
      </form>
    </div>
  );
}
