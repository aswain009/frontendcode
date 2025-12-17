'use client';

import { useEffect, useState } from 'react';
import { getTestimonials } from '@/lib/api';

export default function TestimonialsCarousel() {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const list = await getTestimonials();
        if (!cancelled) setTestimonials(Array.isArray(list) ? list : []);
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Failed to load testimonials');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) return (
    <div className="text-sm text-black/60">Loading testimonials...</div>
  );
  if (error) return (
    <div className="text-sm text-red-600">{String(error)}</div>
  );
  if (!Array.isArray(testimonials) || testimonials.length === 0) return (
    <div className="text-sm text-black/60">No testimonials available yet.</div>
  );

  return (
    <div className="relative">
      <div className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2" style={{ scrollbarWidth: 'thin' }}>
        {testimonials.map((t, idx) => {
          const id = t.id ?? t.testimonialId ?? idx;
          const author = t.createdBy || t.author || t.name || t.customerName || 'Anonymous';
          const text = t.body || t.content || t.message || t.text || '';
          const rating = typeof t.rating === 'number' ? t.rating : (typeof t.stars === 'number' ? t.stars : null);
          const createdAt = t.createdAt || t.date || t.created_on || null;
          const dateStr = createdAt ? new Date(createdAt).toLocaleDateString() : '';
          return (
            <article key={id} className="min-w-[280px] max-w-[320px] snap-start rounded-lg border bg-white/70 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-[color:var(--brand-teal)]">{author}</div>
                {rating != null && (
                  <div className="text-[color:var(--brand-gold)]" title={`${rating} / 5`}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i}>{i < Math.round(Math.max(0, Math.min(5, rating))) ? '★' : '☆'}</span>
                    ))}
                  </div>
                )}
              </div>
              {dateStr && <div className="text-xs text-black/50 mt-0.5">{dateStr}</div>}
              <p className="mt-2 text-sm text-black/80 line-clamp-6">{text}</p>
            </article>
          );
        })}
      </div>
    </div>
  );
}
