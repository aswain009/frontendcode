'use client';

import { useEffect, useState } from 'react';
import { getCustomer, updateCustomer, deleteCustomer } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function EditCustomerPage({ params }) {
  const router = useRouter();
  const [id, setId] = useState(null);
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', address: '', city: '', state: '', postalCode: ''
  });
  const [status, setStatus] = useState({ loading: true, error: null, saving: false });

  useEffect(() => {
    (async () => {
      const p = await params;
      const cid = p?.id;
      setId(cid);
      try {
        const data = await getCustomer(cid);
        setForm({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          phone: data.phone || '',
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          postalCode: data.postalCode || '',
        });
        setStatus(s => ({ ...s, loading: false }));
      } catch (e) {
        setStatus({ loading: false, error: e.message || 'Failed to load customer' });
      }
    })();
  }, [params]);

  function setField(k, v) { setForm(prev => ({ ...prev, [k]: v })); }

  async function onSave(e) {
    e.preventDefault();
    setStatus(s => ({ ...s, saving: true, error: null }));
    try {
      await updateCustomer(id, form);
      router.push('/admin/customers');
      router.refresh?.();
    } catch (e) {
      setStatus(s => ({ ...s, saving: false, error: e.message || 'Failed to save customer' }));
    }
  }

  async function onDelete() {
    if (!confirm('Delete this customer?')) return;
    try {
      await deleteCustomer(id);
      router.push('/admin/customers');
      router.refresh?.();
    } catch (e) {
      setStatus(s => ({ ...s, error: e.message || 'Failed to delete customer' }));
    }
  }

  if (status.loading) return <div>Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Edit Customer</h1>
        <button onClick={onDelete} className="text-red-700 underline">Delete</button>
      </div>
      {status.error && <div className="text-red-600 text-sm">{status.error}</div>}
      <form onSubmit={onSave} className="space-y-3 max-w-2xl">
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
        <div className="flex items-center gap-2">
          <button disabled={status.saving} className="bg-[color:var(--brand-teal)] text-white px-4 py-2 rounded">{status.saving ? 'Saving...' : 'Save Changes'}</button>
          <button type="button" onClick={() => history.back()} className="px-4 py-2 border rounded">Cancel</button>
        </div>
      </form>
    </div>
  );
}
