'use client';

import { useState } from 'react';
import { createProduct } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function NewProductPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    code: '', name: '', price: '', description: '', imageUrl: '', category: ''
  });
  const [status, setStatus] = useState({ loading: false, error: null });

  function setField(k, v) { setForm(prev => ({ ...prev, [k]: v })); }

  async function onSubmit(e) {
    e.preventDefault();
    setStatus({ loading: true, error: null });
    try {
      const payload = {
        code: form.code,
        name: form.name,
        price: Number(form.price || 0),
        description: form.description,
        imageUrl: form.imageUrl || undefined,
        category: form.category || undefined,
      };
      await createProduct(payload);
      router.push('/admin/products');
      router.refresh?.();
    } catch (err) {
      setStatus({ loading: false, error: err.message || 'Failed to create product' });
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">New Product</h1>
      <form onSubmit={onSubmit} className="space-y-3 max-w-2xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input className="border rounded px-3 py-2" placeholder="Code" value={form.code} onChange={e => setField('code', e.target.value)} required />
          <input className="border rounded px-3 py-2" placeholder="Name" value={form.name} onChange={e => setField('name', e.target.value)} required />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input type="number" step="0.01" className="border rounded px-3 py-2" placeholder="Price" value={form.price} onChange={e => setField('price', e.target.value)} required />
          <input className="border rounded px-3 py-2" placeholder="Category (optional)" value={form.category} onChange={e => setField('category', e.target.value)} />
        </div>
        <input className="border rounded px-3 py-2 w-full" placeholder="Image URL (optional)" value={form.imageUrl} onChange={e => setField('imageUrl', e.target.value)} />
        <textarea className="border rounded px-3 py-2 w-full" placeholder="Description" value={form.description} onChange={e => setField('description', e.target.value)} />
        {status.error && <div className="text-red-600 text-sm">{status.error}</div>}
        <div className="flex items-center gap-2">
          <button disabled={status.loading} className="bg-[color:var(--brand-teal)] text-white px-4 py-2 rounded">{status.loading ? 'Saving...' : 'Save Product'}</button>
          <button type="button" onClick={() => history.back()} className="px-4 py-2 border rounded">Cancel</button>
        </div>
      </form>
    </div>
  );
}
