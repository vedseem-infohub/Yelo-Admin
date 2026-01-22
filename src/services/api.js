// Use import.meta.env for Vite (instead of process.env)
// Default to localhost for local development, can be overridden with VITE_API_URL env variable
// For production: Set VITE_API_URL=https://yelo-backend.onrender.com/api in .env file
const API_URL = import.meta.env.VITE_API_URL || import.meta.env.REACT_APP_API_URL || 'https://yelo-backend.onrender.com/api'

// Get auth token
const getAuthToken = () => {
  return localStorage.getItem('yelo_token')
}

// API fetch wrapper
async function apiFetch(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`
  const token = getAuthToken()
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  }
  
  // Handle body for POST/PUT/PATCH requests
  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body)
  } else if (options.body) {
    config.body = options.body
  }
  
  const response = await fetch(url, config)
  
  // Check if response has content before parsing JSON
  const contentType = response.headers.get('content-type')
  if (!contentType || !contentType.includes('application/json')) {
    const text = await response.text()
    throw new Error(text || `Server error: ${response.status} ${response.statusText}`)
  }
  
  const data = await response.json()
  
  if (!response.ok) {
    throw new Error(data.message || `Request failed: ${response.status}`)
  }
  
  return data
}

// Products API
export const productsAPI = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return apiFetch(`/products?${queryString}`)
  },
  getById: (id) => apiFetch(`/products/${id}`),
  getBySlug: (slug) => apiFetch(`/products/${slug}`),
  create: (data) => apiFetch('/products', { method: 'POST', body: data }),
  update: (id, data) => apiFetch(`/products/${id}`, { method: 'PUT', body: data }),
  delete: (id) => apiFetch(`/products/${id}`, { method: 'DELETE' }),
  patch: (id, data) => apiFetch(`/products/${id}`, { method: 'PATCH', body: data }),
  // Admin endpoints
  reassignAndSync: () => apiFetch('/products/admin/reassign-and-sync', { method: 'POST' }),
}

// Categories API
export const categoriesAPI = {
  getAll: () => apiFetch('/categories?includeInactive=true'), // Get all categories including inactive for admin
  getBySlug: (slug) => apiFetch(`/categories/${slug}`),
  create: (data) => apiFetch('/categories/admin/create', { method: 'POST', body: data }),
  update: (slug, data) => apiFetch(`/categories/admin/${slug}`, { method: 'PUT', body: data }),
  delete: (slug) => apiFetch(`/categories/admin/${slug}`, { method: 'DELETE' }),
  addSubcategory: (categorySlug, data) => apiFetch(`/categories/admin/${categorySlug}/subcategories`, { method: 'POST', body: data }),
  updateSubcategory: (categorySlug, subcategorySlug, data) => apiFetch(`/categories/admin/${categorySlug}/subcategories/${subcategorySlug}`, { method: 'PUT', body: data }),
  deleteSubcategory: (categorySlug, subcategorySlug) => apiFetch(`/categories/admin/${categorySlug}/subcategories/${subcategorySlug}`, { method: 'DELETE' }),
  // Free Subcategories API
  getFreeSubcategories: () => apiFetch('/categories/admin/free-subcategories?includeInactive=true'),
  assignFreeSubcategory: (freeSubcategoryId, categorySlug) => apiFetch(`/categories/admin/free-subcategories/${freeSubcategoryId}/assign`, { method: 'POST', body: { categorySlug } }),
  deleteFreeSubcategory: (freeSubcategoryId) => apiFetch(`/categories/admin/free-subcategories/${freeSubcategoryId}`, { method: 'DELETE' }),
}

// Vendors API
export const vendorsAPI = {
  getAll: () => apiFetch('/vendors'),
  getById: (id) => apiFetch(`/vendors/${id}`),
  getBySlug: (slug) => apiFetch(`/vendors/slug/${slug}`),
  create: (data) => apiFetch('/vendors', { method: 'POST', body: data }),
  update: (id, data) => apiFetch(`/vendors/${id}`, { method: 'PUT', body: data }),
  delete: (id) => apiFetch(`/vendors/${id}`, { method: 'DELETE' }),
  approve: (id) => apiFetch(`/vendors/${id}/approve`, { method: 'POST' }),
  reject: (id, reason) => apiFetch(`/vendors/${id}/reject`, { method: 'POST', body: { reason } }),
  updateCommission: (id, commission) => apiFetch(`/vendors/${id}/commission`, { method: 'PUT', body: { commission } }),
}

// Shops API
export const shopsAPI = {
  getAll: () => apiFetch('/shops'),
  getBySlug: (slug) => apiFetch(`/shops/${slug}`),
  create: (data) => apiFetch('/shops', { method: 'POST', body: data }),
  update: (slug, data) => apiFetch(`/shops/${slug}`, { method: 'PUT', body: data }),
  delete: (slug) => apiFetch(`/shops/${slug}`, { method: 'DELETE' }),
  reassignProducts: () => apiFetch('/shops/reassign-products', { method: 'POST' }),
  seedShops: () => apiFetch('/products/admin/seed-shops', { method: 'POST' }),
}

// Orders API
export const ordersAPI = {
  getAllAdmin: (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return apiFetch(`/orders/admin/all?${queryString}`)
  },
  getByIdAdmin: (id) => apiFetch(`/orders/admin/${id}`),
  updateStatus: (id, status) => apiFetch(`/orders/admin/${id}/status`, { method: 'PUT', body: { status } }),
  reassignShop: (id, shopSlug) => apiFetch(`/orders/admin/${id}/reassign-shop`, { method: 'POST', body: { shopSlug } }),
  complete: (id) => apiFetch(`/orders/admin/${id}/complete`, { method: 'POST' }),
}
