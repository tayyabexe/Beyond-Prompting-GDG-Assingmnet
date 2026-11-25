export const FREE_SHIPPING_FROM = 10000

// Formatters are created once. Calling toLocaleString() builds a new one on every call,
// which adds up in tables with many rows.
const MONEY = new Intl.NumberFormat('en-PK')
const DATE_TIME = new Intl.DateTimeFormat('en-PK', { dateStyle: 'medium', timeStyle: 'short' })
const DATE_ONLY = new Intl.DateTimeFormat('en-PK', { dateStyle: 'medium' })

export function pkr(amount) {
  return `Rs ${MONEY.format(Number(amount || 0))}`
}

export function dateTime(iso) {
  return iso ? DATE_TIME.format(new Date(iso)) : '—'
}

export function dateOnly(iso) {
  return iso ? DATE_ONLY.format(new Date(iso)) : '—'
}

export const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
export const INQUIRY_STATUSES = ['open', 'in_progress', 'resolved']

const LABELS = { in_progress: 'In progress', cod: 'Cash on Delivery', demo: 'Demo payment' }

export function label(status) {
  if (!status) return ''
  return LABELS[status] || status.charAt(0).toUpperCase() + status.slice(1)
}
