// Pick API base from env; if not provided, choose based on runtime (dev vs deployed)
const DEFAULT_DEV_API = "http://localhost:8080/api/lugnuts";
const DEFAULT_PROD_API = "https://javaspringprojectapi-production.up.railway.app/api/lugnuts";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || (typeof window !== 'undefined'
  ? ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? DEFAULT_DEV_API : DEFAULT_PROD_API)
  : DEFAULT_DEV_API);

async function safeFetch(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const method = (options.method || 'GET').toUpperCase();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  const requestBody = typeof options.body === 'string' ? options.body : options.body ? JSON.stringify(options.body) : undefined;
  const res = await fetch(url, {
    ...options,
    method,
    headers,
    body: requestBody,
    // Avoid caching dynamic API responses in deployed environments
    cache: 'no-store',
  });
  const responseCt = res.headers.get('content-type') || '';
  const responseText = await res.text();
  let parsed;
  if (responseCt.includes('application/json')) {
    try { parsed = responseText ? JSON.parse(responseText) : null; } catch {}
  }
  if (!res.ok) {
    const err = new Error(parsed?.message || parsed?.error || `Request failed ${res.status} ${res.statusText}`);
    err.status = res.status;
    throw err;
  }
  return parsed !== undefined ? parsed : null;
}

// Products
export function getProducts() {
  return safeFetch('/products');
}
export function getProduct(code) {
  return safeFetch(`/products/${encodeURIComponent(code)}`);
}
export function createProduct(product) {
  return safeFetch('/products', { method: 'POST', body: JSON.stringify(product) });
}
export function updateProduct(code, product) {
  return safeFetch(`/products/${encodeURIComponent(code)}`, { method: 'PUT', body: JSON.stringify(product) });
}
export function deleteProduct(code) {
  return safeFetch(`/products/${encodeURIComponent(code)}`, { method: 'DELETE' });
}

// Orders
export function getOrders() {
  return safeFetch('/orders');
}
export function getOrder(orderNumber) {
  return safeFetch(`/orders/${encodeURIComponent(orderNumber)}`);
}
export function getOrderDetails(orderNumber) {
  return safeFetch(`/orders/${encodeURIComponent(orderNumber)}/details`);
}
export function createOrder(order) {
  const ord = { ...(order || {}) };
  // Ensure a non-zero orderNumber. If missing or 0, generate a timestamp-based number (32-bit safe-ish)
  const ensuredOrderNumber = Number(ord.orderNumber);
  if (!Number.isFinite(ensuredOrderNumber) || ensuredOrderNumber === 0) {
    ord.orderNumber = Math.max(1, Math.floor(Date.now() % 2147483647));
  }
  return safeFetch('/orders', {
    method: 'POST',
    body: JSON.stringify(ord),
  });
}
export function updateOrder(orderNumber, order) {
  return safeFetch(`/orders/${encodeURIComponent(orderNumber)}`, { method: 'PUT', body: JSON.stringify(order) });
}
export function deleteOrder(orderNumber) {
  return safeFetch(`/orders/${encodeURIComponent(orderNumber)}`, { method: 'DELETE' });
}

// Customers
export function getCustomers() {
  return safeFetch('/customers').then(list => {
    if (!Array.isArray(list)) return [];
    // Normalize API shape: some deployments may return [{ customer: { ... } }, ...]
    const flat = list
      .map(item => (item && item.customer ? item.customer : item))
      .filter(c => {
        if (!c) return false;
        const hasNumber = c.customerNumber !== undefined && c.customerNumber !== null;
        const hasId = c.id !== undefined && c.id !== null;
        const hasName = typeof c.customerName === 'string' && c.customerName.length > 0;
        return hasNumber || hasId || hasName;
      });
    return flat;
  });
}
export function getCustomer(id) {
  return safeFetch(`/customers/${encodeURIComponent(id)}`);
}
export function createCustomer(customer) {
  return safeFetch('/customers', { method: 'POST', body: JSON.stringify(customer) });
}
export function updateCustomer(id, customer) {
  return safeFetch(`/customers/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(customer) });
}
export function deleteCustomer(id) {
  return safeFetch(`/customers/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

// Employees
export function getEmployees() {
  return safeFetch('/employees').then(list => {
    if (!Array.isArray(list)) return [];
    // Normalize API shape: server may return [{ salesRep: { ... } }, ...]
    const flat = list
      .map(item => (item && item.salesRep ? item.salesRep : item))
      .filter(emp => emp && (emp.employeeNumber !== undefined && emp.employeeNumber !== null));
    return flat;
  });
}

// Testimonials
export function getTestimonials() {
  return safeFetch('/testimonials').then(list => Array.isArray(list) ? list : []);
}
export function getTestimonial(id) {
  return safeFetch(`/testimonials/${encodeURIComponent(id)}`);
}
export async function createTestimonial(testimonial) {
  // Build the required payload shape. ID will be assigned by the database; no pre-fetch needed.
  const payload = {
    title: testimonial?.title ?? testimonial?.name ?? 'Testimonial',
    createdAt: new Date().toISOString(),
    body: testimonial?.body ?? testimonial?.content ?? testimonial?.message ?? testimonial?.text ?? '',
    createdBy: testimonial?.createdBy ?? testimonial?.author ?? testimonial?.customerName ?? 'Anonymous',
  };

  return safeFetch('/testimonials', { method: 'POST', body: payload });
}
export function updateTestimonial(id, testimonial) {
  return safeFetch(`/testimonials/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(testimonial) });
}
export function deleteTestimonial(id) {
  return safeFetch(`/testimonials/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export { API_BASE };
