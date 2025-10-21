import './globals.css';
import Link from 'next/link';

export const metadata = {
  title: 'Lugnuts Automotive',
  description: 'Shop automotive products',
};

function Navbar() {
  return (
    <header className="w-full border-b border-[color:var(--brand-orange)]/50 bg-[color:var(--brand-cream)]/80 backdrop-blur sticky top-0 z-40">
      <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-3">
        <Link href="/" className="font-bold text-lg text-[color:var(--brand-teal)]">Lugnuts Automotive</Link>
        <nav className="flex items-center gap-4">
          <Link href="/products" className="hover:underline">Products</Link>
          <Link href="/cart" className="hover:underline">Cart</Link>
          <Link href="/admin" className="hover:underline">Admin</Link>
          <form action="/search" className="flex items-center gap-2">
            <input name="q" placeholder="Search" className="border rounded px-2 py-1 text-sm" />
            <button className="text-sm border rounded px-2 py-1">Go</button>
          </form>
        </nav>
      </div>
    </header>
  );
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <Navbar />
        <main className="max-w-5xl mx-auto p-4">{children}</main>
      </body>
    </html>
  );
}
