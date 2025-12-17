'use client';

import { useEffect, useState } from 'react';
import { getTestimonial, updateTestimonial, deleteTestimonial } from '@/lib/api';
import { useRouter, useParams } from 'next/navigation';

export default function EditTestimonialPage() {
  const router = useRouter();
  const params = useParams();
  const idParam = params?.id;
  const id = Array.isArray(idParam) ? idParam[0] : idParam;

  const [form, setForm] = useState({ author: '', content: '', rating: '' });
  const [status, setStatus] = useState({ loading: true, error: null, saving: false });

  function setField(k, v) { setForm(prev => ({ ...prev, [k]: v })); }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getTestimonial(id);
        if (cancelled) return;
        setForm({
          author: data?.createdBy || data?.author || data?.name || data?.customerName || '',
          content: data?.body || data?.content || data?.message || data?.text || '',
          rating: data?.rating ?? data?.stars ?? ''
        });
        setStatus(s => ({ ...s, loading: false }));
      } catch (e) {
        if (!cancelled) setStatus({ loading: false, error: e.message || 'Failed to load testimonial', saving: false });
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  async function onSave(e) {
    e.preventDefault();
    setStatus(s => ({ ...s, saving: true, error: null }));
    try {
      const payload = {
        author: form.author || undefined,
        createdBy: form.author || undefined,
        content: form.content || '',
        body: form.content || '',
        rating: form.rating !== '' ? Number(form.rating) : undefined,
      };
      await updateTestimonial(id, payload);
      router.push('/admin/testimonials');
      router.refresh?.();
    } catch (e) {
      setStatus(s => ({ ...s, saving: false, error: e.message || 'Failed to save testimonial' }));
    }
  }

  async function onDelete() {
    if (!confirm('Delete this testimonial?')) return;
    try {
      await deleteTestimonial(id);
      router.push('/admin/testimonials');
      router.refresh?.();
    } catch (e) {
      setStatus(s => ({ ...s, error: e.message || 'Failed to delete testimonial' }));
    }
  }

  if (status.loading) return <div>Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Edit Testimonial</h1>
        <button onClick={onDelete} className="text-red-700 underline">Delete</button>
      </div>
      {status.error && <div className="text-red-600 text-sm">{status.error}</div>}
      <form onSubmit={onSave} className="space-y-3 max-w-2xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input className="border rounded px-3 py-2" placeholder="Author (optional)" value={form.author} onChange={e => setField('author', e.target.value)} />
          <input type="number" min="0" max="5" step="1" className="border rounded px-3 py-2" placeholder="Rating 0-5 (optional)" value={form.rating} onChange={e => setField('rating', e.target.value)} />
        </div>
        <textarea className="border rounded px-3 py-2 w-full" rows={6} placeholder="Testimonial content" value={form.content} onChange={e => setField('content', e.target.value)} required />
        <div className="flex items-center gap-2">
          <button disabled={status.saving} className="bg-[color:var(--brand-teal)] text-white px-4 py-2 rounded">{status.saving ? 'Saving...' : 'Save Changes'}</button>
          <button type="button" onClick={() => history.back()} className="px-4 py-2 border rounded">Cancel</button>
        </div>
      </form>
    </div>
  );
}
