// Simple localStorage-based cart utility
// Item shape: { code, name, price, quantity, imageUrl }

const KEY = 'lugnuts_cart_v1';

export function getCart() {
  if (typeof window === 'undefined') return { items: [], subtotal: 0 };
  try {
    const raw = localStorage.getItem(KEY);
    const items = raw ? JSON.parse(raw) : [];
    return summarize(items);
  } catch {
    return { items: [], subtotal: 0 };
  }
}

function save(items) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(items));
}

function summarize(items) {
  const subtotal = items.reduce((sum, it) => sum + (Number(it.price || 0) * Number(it.quantity || 0)), 0);
  return { items, subtotal };
}

export function addToCart(product, quantity = 1) {
  const { items } = getCart();
  const idx = items.findIndex(i => i.code === product.code);
  if (idx >= 0) {
    items[idx].quantity += quantity;
  } else {
    items.push({
      code: product.code,
      name: product.name || product.productName || product.code,
      price: Number(product.price || product.msrp || 0),
      imageUrl: product.imageUrl || null,
      quantity,
    });
  }
  save(items);
  return summarize(items);
}

export function updateQuantity(code, quantity) {
  const { items } = getCart();
  const next = items.map(i => i.code === code ? { ...i, quantity: Math.max(1, Number(quantity || 1)) } : i);
  save(next);
  return summarize(next);
}

export function removeFromCart(code) {
  const { items } = getCart();
  const next = items.filter(i => i.code !== code);
  save(next);
  return summarize(next);
}

export function clearCart() {
  save([]);
  return summarize([]);
}
