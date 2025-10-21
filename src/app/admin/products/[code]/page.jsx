'use client';

import { useEffect, useState } from 'react';
import { getProduct, updateProduct, deleteProduct } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function EditProductPage({ params }) {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [form, setForm] = useState({ name: '', price: '', description: '', imageUrl: '', category: '' });
  const [status, setStatus] = useState({ loading: true, error: null, saving: false });

  useEffect(() => {
    (async () => {
      const p = await params;
      const productCode = p?.code;
      setCode(productCode);
      try {
        const data = await getProduct(productCode);
        setForm({
          name: data.name || data.productName || '',
          price: String(data.price ?? data.msrp ?? ''),
          description: data.description || '',
          imageUrl: data.imageUrl || '',
          category: data.category || data.categoryName || '',
        });
        setStatus(s => ({ ...s, loading: false }));
      } catch (e) {
        setStatus({ loading: false, error: e.message || 'Failed to load product' });
      }
    })();
  }, [params]);

  function setField(k, v) { setForm(prev => ({ ...prev, [k]: v })); }

  async function onSave(e) {
    e.preventDefault();
    setStatus(s => ({ ...s, saving: true, error: null }));
    try {
      const payload = {
        code,
        name: form.name,
        price: Number(form.price || 0),
        description: form.description,
        imageUrl: form.imageUrl || undefined,
        category: form.category || undefined,
      };
      await updateProduct(code, payload);
      router.push('/admin/products');
      router.refresh?.();
    } catch (e) {
      setStatus(s => ({ ...s, saving: false, error: e.message || 'Failed to save product' }));
    }
  }

  async function onDelete() {
    if (!confirm('Delete this product?')) return;
    try {
      await deleteProduct(code);
      router.push('/admin/products');
      router.refresh?.();
    } catch (e) {
      setStatus(s => ({ ...s, error: e.message || 'Failed to delete product' }));
    }
  }

  if (status.loading) return <div>Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Edit Product</h1>
        <button onClick={onDelete} className="text-red-700 underline">Delete</button>
      </div>
      {status.error && <div className="text-red-600 text-sm">{status.error}</div>}
      <form onSubmit={onSave} className="space-y-3 max-w-2xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input className="border rounded px-3 py-2" placeholder="Code" value={code} onChange={e => setCode(e.target.value)} disabled />
          <input className="border rounded px-3 py-2" placeholder="Name" value={form.name} onChange={e => setField('name', e.target.value)} required />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input type="number" step="0.01" className="border rounded px-3 py-2" placeholder="Price" value={form.price} onChange={e => setField('price', e.target.value)} required />
          <input className="border rounded px-3 py-2" placeholder="Category (optional)" value={form.category} onChange={e => setField('category', e.target.value)} />
        </div>
        <input className="border rounded px-3 py-2 w-full" placeholder="Image URL (optional)" value={form.imageUrl} onChange={e => setField('imageUrl', e.target.value)} />
        <textarea className="border rounded px-3 py-2 w-full" placeholder="Description" value={form.description} onChange={e => setField('description', e.target.value)} />
        <div className="flex items-center gap-2">
          <button disabled={status.saving} className="bg-[color:var(--brand-teal)] text-white px-4 py-2 rounded">{status.saving ? 'Saving...' : 'Save Changes'}</button>
          <button type="button" onClick={() => history.back()} className="px-4 py-2 border rounded">Cancel</button>
        </div>
      </form>
    </div>
  );
}
