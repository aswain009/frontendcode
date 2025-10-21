import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="font-sans">
      {/* Hero */}
      <section className="rounded-xl border border-[color:var(--brand-orange)]/40 bg-[color:var(--brand-cream)] p-6 sm:p-10 shadow-sm">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="shrink-0">
            <Image src="/logo.png" alt="Lugnuts Automotive" width={180} height={180} priority unoptimized />
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[color:var(--brand-teal)]">Welcome to Lugnuts Automotive</h1>
            <p className="mt-2 text-[color:var(--brand-teal)]/80 max-w-2xl">
              Quality parts, fair prices, fast service. Shop our selection of automotive products and get back on the road.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
              <Link href="/products" className="inline-block rounded-md px-5 py-2.5 text-white bg-[color:var(--brand-teal)] hover:bg-[color:var(--brand-teal)]/90 transition">Shop Products</Link>
              <Link href="/cart" className="inline-block rounded-md px-5 py-2.5 border border-[color:var(--brand-orange)] text-[color:var(--brand-orange)] hover:bg-[color:var(--brand-orange)]/10 transition">View Cart</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Quick links */}
      <section className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/search" className="rounded-lg p-4 border bg-white/70 hover:shadow transition">
          <div className="text-sm font-semibold text-[color:var(--brand-teal)]">Search</div>
          <div className="text-sm text-black/60">Find parts by name, description, or code.</div>
        </Link>
        <Link href="/products" className="rounded-lg p-4 border bg-white/70 hover:shadow transition">
          <div className="text-sm font-semibold text-[color:var(--brand-teal)]">All Products</div>
          <div className="text-sm text-black/60">Browse our full catalog.</div>
        </Link>
        <Link href="/cart" className="rounded-lg p-4 border bg-white/70 hover:shadow transition">
          <div className="text-sm font-semibold text-[color:var(--brand-teal)]">Your Cart</div>
          <div className="text-sm text-black/60">Review items and checkout.</div>
        </Link>
      </section>

      {/* Features */}
      <section className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-lg p-4 border border-[color:var(--brand-gold)]/40 bg-[color:var(--brand-cream)]">
          <div className="font-semibold text-[color:var(--brand-gold)]">Trusted Quality</div>
          <p className="text-sm mt-1 text-black/70">Hand-picked parts from reliable manufacturers.</p>
        </div>
        <div className="rounded-lg p-4 border border-[color:var(--brand-gold)]/40 bg-[color:var(--brand-cream)]">
          <div className="font-semibold text-[color:var(--brand-gold)]">Fast Checkout</div>
          <p className="text-sm mt-1 text-black/70">Simple cart and secure order flow.</p>
        </div>
        <div className="rounded-lg p-4 border border-[color:var(--brand-gold)]/40 bg-[color:var(--brand-cream)]">
          <div className="font-semibold text-[color:var(--brand-gold)]">Great Support</div>
          <p className="text-sm mt-1 text-black/70">We’re here to help you find the right part.</p>
        </div>
      </section>

      <footer className="mt-10 text-center text-sm text-black/60">
        Looking for something specific? Try our <Link href="/search" className="underline text-[color:var(--brand-teal)]">search</Link> or go straight to the <Link href="/products" className="underline text-[color:var(--brand-teal)]">catalog</Link>.
      </footer>
    </div>
  );
}
