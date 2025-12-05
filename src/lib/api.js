const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080/api/lugnuts";

async function safeFetch(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const method = (options.method || 'GET').toUpperCase();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  const requestBody = typeof options.body === 'string' ? options.body : options.body ? JSON.stringify(options.body) : undefined;
  const startedAt = Date.now();
  try {
    console.groupCollapsed(`[API] ${method} ${url}`);
    console.log('Request headers:', headers);
    if (requestBody) {
      try { console.log('Request body (parsed):', JSON.parse(requestBody)); } catch { console.log('Request body (raw):', requestBody); }
    } else {
      console.log('Request body: <none>');
    }
    const res = await fetch(url, {
      ...options,
      method,
      headers,
      body: requestBody,
      // Revalidate data periodically on the server; client fetch unaffected
      next: { revalidate: 30 },
    });
    const durationMs = Date.now() - startedAt;
    const responseCt = res.headers.get('content-type') || '';
    const responseText = await res.text();
    let parsed;
    if (responseCt.includes('application/json')) {
      try { parsed = responseText ? JSON.parse(responseText) : null; } catch {}
    }
    console.log('Status:', res.status, res.statusText, `(${durationMs} ms)`);
    console.log('Response headers:', Object.fromEntries([...res.headers.entries()]));
    console.log('Response body:', parsed !== undefined ? parsed : responseText);
    if (!res.ok) {
      const err = new Error(`Request failed ${res.status} ${res.statusText}`);
      err.status = res.status;
      err.statusText = res.statusText;
      err.url = url;
      err.method = method;
      err.requestHeaders = headers;
      err.requestBody = requestBody;
      err.responseHeaders = Object.fromEntries([...res.headers.entries()]);
      err.responseText = responseText;
      err.responseJson = parsed;
      err.startedAt = startedAt;
      err.durationMs = durationMs;
      console.error('API request failed:', err);
      console.groupEnd();
      throw err;
    }
    console.groupEnd();
    return parsed !== undefined ? parsed : null;
  } catch (err) {
    // If fetch itself threw (network, CORS), log with context
    try {
      console.error('API error (network/uncaught):', { url, method, headers, requestBody });
      console.error(err);
    } catch {}
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
  // Per docs for POST /orders, send orderNumber: 0
  const bodyObj = { ...ord, orderNumber: 0 };
  return safeFetch('/orders', {
    method: 'POST',
    body: JSON.stringify(bodyObj),
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
