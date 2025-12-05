import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

// Server layout to protect all /admin/orders/* pages in production
export default function AdminOrdersLayout({ children }) {
  // Determine hostname to bypass auth locally
  const hdrs = headers();
  const host = hdrs.get('host') || '';
  const hostname = host.split(':')[0];
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';

  if (!isLocal) {
    const token = cookies().get('admin_session')?.value;
    if (!token) {
      // No admin session cookie in prod → redirect to admin login
      redirect('/admin');
    }
  }

  return children;
}
