// One place for every call to the FastAPI backend.
// - Turns backend errors ({detail: "..."} or {detail: {field_errors: {...}}}) into ApiError.
// - Tells the UI when a request is slow, so it can show "waking up the server"
//   (Render's free tier sleeps after ~15 minutes idle and takes up to a minute to start).

const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/$/, '')
const SLOW_AFTER_MS = 3500
const TIMEOUT_MS = 70000

export class ApiError extends Error {
  constructor(status, message, fieldErrors = null) {
    super(message)
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

// --- slow-request tracking (read by <ServerWakeNotice />) ---
let slowCount = 0
const listeners = new Set()
const emit = () => listeners.forEach((fn) => fn(slowCount > 0))
export function onSlowChange(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

function messageFrom(status, data) {
  const d = data?.detail
  if (typeof d === 'string') return d
  if (d && typeof d === 'object' && d.field_errors) return 'Please fix the highlighted fields.'
  if (status === 401) return 'Please log in again.'
  if (status === 403) return "This account doesn't have admin access."
  if (status === 404) return 'Not found.'
  return `Something went wrong (error ${status}). Please try again.`
}

// Public GETs that are already on their way are shared: if two components (or React's
// development double-render) ask for the same URL at once, only one request is sent.
const inflight = new Map()
export function request(path, opts = {}) {
  const shareable = (!opts.method || opts.method === 'GET') && !opts.token
  if (!shareable) return send(path, opts)
  if (!inflight.has(path)) {
    inflight.set(path, send(path, opts).finally(() => inflight.delete(path)))
  }
  return inflight.get(path)
}

async function send(path, { method = 'GET', body, token } = {}) {
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  const controller = new AbortController()
  const abortTimer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  let markedSlow = false
  const slowTimer = setTimeout(() => {
    markedSlow = true
    slowCount += 1
    emit()
  }, SLOW_AFTER_MS)

  let res
  try {
    res = await fetch(BASE + path, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })
  } catch {
    throw new ApiError(0, "Can't reach the server. Check your connection and try again.")
  } finally {
    clearTimeout(abortTimer)
    clearTimeout(slowTimer)
    if (markedSlow) {
      slowCount -= 1
      emit()
    }
  }

  let data = null
  try {
    data = await res.json()
  } catch {
    /* empty body */
  }
  if (!res.ok) {
    const fieldErrors = data?.detail?.field_errors || null
    throw new ApiError(res.status, messageFrom(res.status, data), fieldErrors)
  }
  return data
}

// Builds "?a=1&b=2" from an object, skipping empty values (always URL-encoded).
function query(params = {}) {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') qs.set(k, v)
  })
  const s = qs.toString()
  return s ? `?${s}` : ''
}

// --- storefront ---
export const api = {
  categories: () => request('/categories'),
  products: (params) => request(`/products${query(params)}`),
  product: (id) => request(`/products/${encodeURIComponent(id)}`),
  quote: (items) => request('/cart/quote', { method: 'POST', body: { items } }),
  placeOrder: (order) => request('/orders', { method: 'POST', body: order }),
  sendInquiry: (inquiry) => request('/inquiries', { method: 'POST', body: inquiry }),
}

// --- admin (every call needs the logged-in admin's JWT) ---
// `token` can be a string or a function that returns the current token. With a function the
// same api object keeps working after Supabase refreshes the token, so pages don't reload.
export const adminApi = (token) => {
  const auth = (extra = {}) => ({ ...extra, token: typeof token === 'function' ? token() : token })
  const enc = encodeURIComponent
  return {
    me: () => request('/admin/me', auth()),
    stats: () => request('/admin/stats', auth()),
    orders: (status) => request(`/admin/orders${query({ status })}`, auth()),
    order: (id) => request(`/admin/orders/${enc(id)}`, auth()),
    setOrderStatus: (id, status) => request(`/admin/orders/${enc(id)}/status`, auth({ method: 'PATCH', body: { status } })),
    customers: () => request('/admin/customers', auth()),
    inquiries: (status) => request(`/admin/inquiries${query({ status })}`, auth()),
    setInquiryStatus: (id, status) =>
      request(`/admin/inquiries/${enc(id)}/status`, auth({ method: 'PATCH', body: { status } })),
    addNote: (id, note) => request(`/admin/inquiries/${enc(id)}/notes`, auth({ method: 'POST', body: { note } })),
  }
}
