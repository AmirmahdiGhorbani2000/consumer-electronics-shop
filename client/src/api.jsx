const BASE = import.meta.env?.VITE_API_URL || "";

async function request(path, options = {}) {
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Network error" }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
  getProducts: (params = "") => request(`/api/products${params ? "?" + params : ""}`),
  getProduct: (id) => request(`/api/products/${id}`),
  createProduct: (data) => request("/api/products", { method: "POST", body: JSON.stringify(data) }),
  updateProduct: (id, data) => request(`/api/products/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteProduct: (id) => request(`/api/products/${id}`, { method: "DELETE" }),

  register: (data) => request("/api/auth/register", { method: "POST", body: JSON.stringify(data) }),
  login: (email, password) => request("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  me: () => request("/api/auth/me"),

  createOrder: (items) => request("/api/orders", { method: "POST", body: JSON.stringify({ items }) }),
  getMyOrders: () => request("/api/orders/my"),

  requestPayment: (orderId) => request(`/api/payment/request/${orderId}`, { method: "POST" }),
};

export const apiBase = BASE;
