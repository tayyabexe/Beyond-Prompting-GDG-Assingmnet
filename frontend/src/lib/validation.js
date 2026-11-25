// Same rules as the backend (backend/app/schemas.py), so users see errors before submitting.
// The backend still checks everything; these are just for a faster, friendlier form.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^(03\d{9}|\+923\d{9})$/

const length = (value, min, max, name) => {
  const v = (value || '').trim()
  if (!v) return `${name} is required.`
  if (v.length < min) return `${name} must be at least ${min} characters.`
  if (v.length > max) return `${name} must be at most ${max} characters.`
  return null
}

export const cleanPhone = (v) => (v || '').replace(/[\s-]/g, '')

const email = (v) => {
  if (!(v || '').trim()) return 'Email is required.'
  return EMAIL_RE.test(v.trim()) ? null : 'Enter a valid email address.'
}

export function validateCheckout(f) {
  const errors = {
    name: length(f.name, 2, 60, 'Name'),
    email: email(f.email),
    phone: PHONE_RE.test(cleanPhone(f.phone)) ? null : 'Enter a valid mobile number (03XXXXXXXXX).',
    address: length(f.address, 10, 200, 'Address'),
    city: length(f.city, 2, 60, 'City'),
    payment: ['cod', 'demo'].includes(f.payment) ? null : 'Choose a payment method.',
  }
  return Object.fromEntries(Object.entries(errors).filter(([, e]) => e))
}

export function validateInquiry(f) {
  const errors = {
    name: length(f.name, 2, 60, 'Name'),
    email: email(f.email),
    subject: length(f.subject, 3, 100, 'Subject'),
    message: length(f.message, 10, 1000, 'Message'),
  }
  return Object.fromEntries(Object.entries(errors).filter(([, e]) => e))
}

export function validateNote(note) {
  return length(note, 1, 500, 'Note')
}
