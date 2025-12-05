const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080/api/lugnuts";

async function safeFetch(path, options = {}) {
  const url = `${API_BASE}${path}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      // Revalidate data periodically on the server; client fetch unaffected
      next: { revalidate: 30 },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Request failed ${res.status} ${res.statusText}: ${text}`);
    }
    // try json; allow empty
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      return await res.json();
    }
    return null;
  } catch (err) {
    console.error('API error', url, err);
    throw err;
  }
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
  const ord = order || {};
  // Ensure we always have a non-zero 32-bit order number in the body
  let orderNumber = ord.orderNumber || ord.id || ord.orderNo || Math.max(1, Math.floor(Date.now() % 2147483647));
  const body = JSON.stringify({ ...ord, orderNumber });
  const mode = (process.env.NEXT_PUBLIC_ORDERS_CREATE_MODE || 'post').toLowerCase();
  if (mode === 'path') {
    // Some deployments require the order number in the path
    return safeFetch(`/orders/${encodeURIComponent(orderNumber)}`, {
      method: 'PUT',
      body,
    });
  }
  // Default: POST /orders with body
  return safeFetch('/orders', {
    method: 'POST',
    body,
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
  return safeFetch('/customers');
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

export { API_BASE };
