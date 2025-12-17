'use client';

import { useState } from 'react';
import { createTestimonial } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function NewTestimonialPage() {
  const router = useRouter();
  const [form, setForm] = useState({ title: '', body: '', createdBy: '' });
  const [status, setStatus] = useState({ loading: false, error: null });

  function setField(k, v) { setForm(prev => ({ ...prev, [k]: v })); }

  async function onSubmit(e) {
    e.preventDefault();
    setStatus({ loading: true, error: null });
    try {
      // createTestimonial will add createdAt; we pass through the fields per contract
      const payload = {
        title: form.title,
        body: form.body,
        createdBy: form.createdBy || 'Anonymous',
      };
      await createTestimonial(payload);
      router.push('/admin/testimonials');
      router.refresh?.();
    } catch (err) {
      setStatus({ loading: false, error: err.message || 'Failed to create testimonial' });
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">New Testimonial</h1>
      <form onSubmit={onSubmit} className="space-y-3 max-w-2xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input className="border rounded px-3 py-2" placeholder="Title" value={form.title} onChange={e => setField('title', e.target.value)} required />
          <input className="border rounded px-3 py-2" placeholder="Created By (optional)" value={form.createdBy} onChange={e => setField('createdBy', e.target.value)} />
        </div>
        <textarea className="border rounded px-3 py-2 w-full" rows={6} placeholder="Body" value={form.body} onChange={e => setField('body', e.target.value)} required />
        {status.error && <div className="text-red-600 text-sm">{status.error}</div>}
        <div className="flex items-center gap-2">
          <button disabled={status.loading} className="bg-[color:var(--brand-teal)] text-white px-4 py-2 rounded">{status.loading ? 'Saving...' : 'Save Testimonial'}</button>
          <button type="button" onClick={() => history.back()} className="px-4 py-2 border rounded">Cancel</button>
        </div>
      </form>
    </div>
  );
}
