import Link from 'next/link';
import { getTestimonials } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function AdminTestimonialsPage() {
  let testimonials = [];
  let error = null;
  try {
    testimonials = await getTestimonials();
  } catch (e) {
    error = e.message;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Testimonials</h1>
        <Link href="/admin/testimonials/new" className="px-3 py-2 rounded bg-[color:var(--brand-teal)] text-white">New Testimonial</Link>
      </div>
      {error && <div className="text-red-600">Failed to load testimonials: {String(error)}</div>}
      <table className="w-full text-sm border rounded">
        <thead>
          <tr className="bg-gray-100">
            <th className="text-left p-2">ID</th>
            <th className="text-left p-2">Author</th>
            <th className="text-left p-2">Rating</th>
            <th className="text-left p-2">Excerpt</th>
            <th className="text-left p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {(testimonials || []).map((t, idx) => {
            const id = t.id;
            const author = t.created_by || t.createdBy || 'Anonymous';
            const rating = t.rating ?? '';
            const text = t.body || '';
            return (
              <tr key={id} className="border-t">
                <td className="p-2 font-mono">{id}</td>
                <td className="p-2">{author}</td>
                <td className="p-2">{rating !== '' ? `${rating}/5` : '—'}</td>
                <td className="p-2 text-black/70">{text.length > 80 ? text.slice(0, 77) + '…' : text}</td>
                <td className="p-2">
                  <Link href={`/admin/testimonials/${encodeURIComponent(id)}`} className="underline">Edit</Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
