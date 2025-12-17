import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

// Server layout to protect all /admin/testimonials/* pages in production
export default function AdminTestimonialsLayout({ children }) {
  const hdrs = headers();
  const host = hdrs.get('host') || '';
  const hostname = host.split(':')[0];
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';

  if (!isLocal) {
    const token = cookies().get('admin_session')?.value;
    if (!token) {
      redirect('/admin');
    }
  }

  return children;
}
