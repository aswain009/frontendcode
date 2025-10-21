'use client';

import { useState } from 'react';
import { createCustomer } from '@/lib/api';
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
  });
  const [status, setStatus] = useState({ loading: false, error: null });

  function setField(k, v) { setForm(prev => ({ ...prev, [k]: v })); }

  async function onSubmit(e) {
    e.preventDefault();
    setStatus({ loading: true, error: null });
    try {
      await createCustomer(form);
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input type="email" className="border rounded px-3 py-2" placeholder="Email" value={form.email} onChange={e => setField('email', e.target.value)} />
          <input className="border rounded px-3 py-2" placeholder="Phone" value={form.phone} onChange={e => setField('phone', e.target.value)} />
        </div>
        <input className="border rounded px-3 py-2 w-full" placeholder="Address" value={form.address} onChange={e => setField('address', e.target.value)} />
        <div className="grid grid-cols-3 gap-3">
          <input className="border rounded px-3 py-2" placeholder="City" value={form.city} onChange={e => setField('city', e.target.value)} />
          <input className="border rounded px-3 py-2" placeholder="State" value={form.state} onChange={e => setField('state', e.target.value)} />
          <input className="border rounded px-3 py-2" placeholder="Postal Code" value={form.postalCode} onChange={e => setField('postalCode', e.target.value)} />
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
