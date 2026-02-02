// src/api.js
import axios from 'axios';

// Product Service runs on port 4002, Auth on 4001, Order on 4004
// Product Service runs on port 4002, Auth on 4001, Order on 4004
// When deployed, we point to the Load Balancer (ALB) which hits the Gateway on port 80
const ALB_URL = 'http://cloudretail-alb-1680329126.us-east-1.elb.amazonaws.com';
const API_URL = process.env.REACT_APP_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost' : ALB_URL);

// Routes now go through the Gateway (port 80 via ALB or 4000 locally)
const GW_PORT = window.location.hostname === 'localhost' ? ':4000' : '';

export const AUTH_BASE = process.env.REACT_APP_AUTH_URL || `${API_URL}${GW_PORT}`;
export const PRODUCT_BASE = process.env.REACT_APP_PRODUCT_URL || `${API_URL}${GW_PORT}`;
export const ORDER_BASE = process.env.REACT_APP_ORDER_URL || `${API_URL}${GW_PORT}`;
export const INVENTORY_BASE = process.env.REACT_APP_INVENTORY_URL || `${API_URL}${GW_PORT}`;

// Helper to attach JWT automatically
function authHeaders(admin = false) {
  const token = admin ? localStorage.getItem('admin_jwt') : localStorage.getItem('jwt');
  if (!token) return {};
  return {
    Authorization: `Bearer ${token}`,
  };
}

// ------- AUTH API -------

export async function registerUser({ first_name, last_name, email, password, role = 'USER' }) {
  const res = await axios.post(`${AUTH_BASE}/api/v1/auth/register`, {
    first_name,
    last_name,
    email,
    password,
    role,
  });
  return res.data;
}

export async function loginUser({ email, password }) {
  const res = await axios.post(`${AUTH_BASE}/api/v1/auth/login`, {
    email,
    password,
  });
  return res.data; // { token, user }
}

export async function resetPassword({ email, newPassword, secretKey }) {
  const res = await axios.post(`${AUTH_BASE}/api/v1/auth/emergency-reset`, {
    email,
    newPassword,
    secretKey,
  });
  return res.data;
}

export async function fetchUsers() {
  const token = localStorage.getItem('admin_jwt') || localStorage.getItem('jwt');
  const res = await axios.get(`${AUTH_BASE}/api/v1/users`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}

export async function deleteUser(id) {
  const token = localStorage.getItem('admin_jwt') || localStorage.getItem('jwt');
  const res = await axios.delete(`${AUTH_BASE}/api/v1/users/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}

export async function updateUser(id, userData) {
  const token = localStorage.getItem('admin_jwt') || localStorage.getItem('jwt');
  const res = await axios.put(`${AUTH_BASE}/api/v1/users/${id}`, userData, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}

// ------- PRODUCT API -------

export async function fetchProducts(params = {}, tokenOverride = null) {
  const token = tokenOverride || localStorage.getItem('jwt');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await axios.get(`${PRODUCT_BASE}/api/v1/products`, { params, headers });
  return res.data;
}

export async function fetchSuggestions(search) {
  const res = await axios.get(`${PRODUCT_BASE}/api/v1/products/suggestions`, { params: { search } });
  return res.data;
}

export async function fetchProductById(id) {
  const token = localStorage.getItem('jwt');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await axios.get(`${PRODUCT_BASE}/api/v1/products/${id}`, { headers });
  return res.data;
}

export async function fetchReviews(productId) {
  const res = await axios.get(`${PRODUCT_BASE}/api/v1/products/${productId}/reviews`);
  return res.data;
}

export async function submitReview(productId, review) {
  const token = localStorage.getItem('jwt');
  const res = await axios.post(`${PRODUCT_BASE}/api/v1/products/${productId}/reviews`, review, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}

export async function fetchWishlist() {
  const token = localStorage.getItem('jwt');
  const res = await axios.get(`${PRODUCT_BASE}/api/v1/wishlist`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}

export async function addToWishlist(productId) {
  const token = localStorage.getItem('jwt');
  const res = await axios.post(`${PRODUCT_BASE}/api/v1/wishlist`, { productId }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}

export async function removeFromWishlist(productId) {
  const token = localStorage.getItem('jwt');
  const res = await axios.delete(`${PRODUCT_BASE}/api/v1/wishlist/${productId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}

export async function createProduct(productData, tokenOverride = null) {
  const token = tokenOverride || localStorage.getItem('jwt');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await axios.post(
    `${PRODUCT_BASE}/api/v1/products`,
    productData,
    { headers }
  );
  return res.data;
}

export async function updateStock(productId, quantityAdded, tokenOverride = null) {
  const token = tokenOverride || localStorage.getItem('jwt');
  const res = await axios.post(
    `${PRODUCT_BASE}/api/v1/products/${productId}/stock`,
    { quantity_added: quantityAdded },
    { headers: token ? { Authorization: `Bearer ${token}` } : {} }
  );
  return res.data;
}

// Upload product image and get back a public URL
export async function uploadProductImage(file, tokenOverride = null) {
  const formData = new FormData();
  formData.append('image', file);

  const token = tokenOverride || localStorage.getItem('jwt');

  const res = await axios.post(
    `${PRODUCT_BASE}/api/v1/products/upload-image`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }
  );

  // { imageUrl: "http://localhost:4002/uploads/xxxx.jpg" }
  return res.data;
}

// ------- ORDER API -------

// Expect items: [{ product_id, quantity, price }, ...]
// And optional checkout info
export async function createOrder(items, checkoutInfo = {}) {
  const res = await axios.post(
    `${ORDER_BASE}/api/v1/orders`,
    { items, ...checkoutInfo },
    { headers: authHeaders() }
  );
  return res.data;
}

export async function fetchOrderById(id) {
  const res = await axios.get(
    `${ORDER_BASE}/api/v1/orders/${id}`,
    { headers: authHeaders() }
  );
  return res.data;
}

// ------- CART API -------

export async function fetchCart() {
  const res = await axios.get(`${ORDER_BASE}/api/v1/cart`, { headers: authHeaders() });
  return res.data;
}

export async function addToCartAPI(product_id, quantity) {
  const res = await axios.post(
    `${ORDER_BASE}/api/v1/cart`,
    { product_id, quantity },
    { headers: authHeaders() }
  );
  return res.data;
}

export async function updateCartItemAPI(product_id, quantity) {
  const res = await axios.put(
    `${ORDER_BASE}/api/v1/cart/item`,
    { product_id, quantity },
    { headers: authHeaders() }
  );
  return res.data;
}

export async function removeCartItemAPI(product_id) {
  const res = await axios.delete(
    `${ORDER_BASE}/api/v1/cart/${product_id}`,
    { headers: authHeaders() }
  );
  return res.data;
}

export async function clearCartAPI() {
  const res = await axios.delete(
    `${ORDER_BASE}/api/v1/cart`,
    { headers: authHeaders() }
  );
  return res.data;
}

export async function fetchOrders() {
  const res = await axios.get(`${ORDER_BASE}/api/v1/orders`, { headers: authHeaders() });
  return res.data;
}

export async function submitItemFeedback(orderItemId, rating, feedback) {
  const res = await axios.put(
    `${ORDER_BASE}/api/v1/orders/items/${orderItemId}/feedback`,
    { rating, feedback },
    { headers: authHeaders() }
  );
  return res.data;
}

export async function fetchAdminOrders() {
  const res = await axios.get(`${ORDER_BASE}/api/v1/admin/orders`, {
    headers: authHeaders(true)
  });
  return res.data;
}

export async function updateOrderStatus(orderId, status) {
  const res = await axios.put(
    `${ORDER_BASE}/api/v1/admin/orders/${orderId}/status`,
    { status },
    { headers: authHeaders(true) }
  );
  return res.data;
}

export async function exportUserData() {
  const res = await axios.get(`${ORDER_BASE}/api/v1/orders/export`, {
    headers: authHeaders(),
    responseType: 'blob' // Important for binary/json files
  });
  return res.data;
}
