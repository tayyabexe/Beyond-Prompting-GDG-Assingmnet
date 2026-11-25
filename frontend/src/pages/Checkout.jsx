import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { api, ApiError } from '../api/client'
import OrderSummary from '../components/OrderSummary'
import { ErrorBox, Field, Loader } from '../components/ui'
import { useCart } from '../context/CartContext'
import { pkr } from '../lib/format'
import { useQuote } from '../lib/useQuote'
import { useTitle } from '../lib/useTitle'
import { cleanPhone, validateCheckout } from '../lib/validation'

const EMPTY = { name: '', email: '', phone: '', address: '', city: '', payment: 'cod', simulate_decline: false }

export default function Checkout() {
  const { items, clear } = useCart()
  const quote = useQuote()
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  useTitle('Checkout')

  if (!items.length && !submitting) return <Navigate to="/cart" replace />

  const set = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((f) => ({ ...f, [key]: value }))
    if (errors[key]) setErrors((er) => ({ ...er, [key]: undefined }))
  }

  const submit = async (e) => {
    e.preventDefault()
    setSubmitError(null)
    const found = validateCheckout(form)
    setErrors(found)
    if (Object.keys(found).length) {
      document.getElementById(Object.keys(found)[0])?.focus()
      return
    }
    setSubmitting(true)
    try {
      const order = await api.placeOrder({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: cleanPhone(form.phone),
        address: form.address.trim(),
        city: form.city.trim(),
        payment: form.payment,
        simulate_decline: form.payment === 'demo' && form.simulate_decline,
        items,
      })
      sessionStorage.setItem('nexus-last-order', JSON.stringify(order))
      clear()
      navigate('/order/confirmation', { replace: true })
    } catch (err) {
      setSubmitting(false)
      if (err instanceof ApiError && err.fieldErrors) setErrors(err.fieldErrors)
      setSubmitError(err)
      if (err instanceof ApiError && err.status === 409) quote.reload() // stock changed: show fresh numbers
    }
  }

  const q = quote.data
  return (
    <div className="container page">
      <nav className="breadcrumb" aria-label="Breadcrumb"><Link to="/cart">Cart</Link> / <span>Checkout</span></nav>
      <h1>Checkout</h1>

      <div className="cart-layout">
        <form className="card form" onSubmit={submit} noValidate>
          <h2>Delivery details</h2>
          <div className="form-grid">
            <Field id="name" label="Full name" value={form.name} onChange={set('name')} error={errors.name} autoComplete="name" maxLength={60} />
            <Field id="email" label="Email" type="email" value={form.email} onChange={set('email')} error={errors.email} autoComplete="email" />
            <Field id="phone" label="Mobile number" type="tel" value={form.phone} onChange={set('phone')} error={errors.phone} hint="e.g. 0300 1234567 or +92 300 1234567" autoComplete="tel" />
            <Field id="city" label="City" value={form.city} onChange={set('city')} error={errors.city} autoComplete="address-level2" maxLength={60} />
          </div>
          <Field id="address" label="Street address" as="textarea" rows={3} value={form.address} onChange={set('address')} error={errors.address} autoComplete="street-address" maxLength={200} />

          <fieldset className="payment">
            <legend>Payment method</legend>
            <label className={`radio-card ${form.payment === 'cod' ? 'checked' : ''}`}>
              <input type="radio" name="payment" value="cod" checked={form.payment === 'cod'} onChange={set('payment')} />
              <span><strong>Cash on Delivery</strong><small>Pay in cash when your order arrives.</small></span>
            </label>
            <label className={`radio-card ${form.payment === 'demo' ? 'checked' : ''}`}>
              <input type="radio" name="payment" value="demo" checked={form.payment === 'demo'} onChange={set('payment')} />
              <span><strong>Demo payment</strong><small>Simulated online payment — no card details are asked for or stored.</small></span>
            </label>
            {form.payment === 'demo' && (
              <label className="checkbox">
                <input type="checkbox" checked={form.simulate_decline} onChange={set('simulate_decline')} />
                Simulate a declined payment (for testing)
              </label>
            )}
            {errors.payment && <small className="field-error">{errors.payment}</small>}
          </fieldset>

          <ErrorBox error={submitError} />
          <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={submitting || !q || q.has_issues}>
            {submitting ? 'Placing order…' : q ? `Place order · ${pkr(q.total)}` : 'Place order'}
          </button>
        </form>

        <div>
          <ErrorBox error={quote.error} onRetry={quote.reload} />
          {!q && quote.loading && <Loader text="Checking prices and stock…" />}
          {q && (
            <OrderSummary quote={q}>
              <ul className="summary-lines">
                {q.lines.map((l) => (
                  <li key={l.product_id}>
                    <span>{l.name || l.product_id} × {l.qty}</span>
                    <span>{l.line_total !== undefined ? pkr(l.line_total) : '—'}</span>
                  </li>
                ))}
              </ul>
              {q.has_issues && (
                <p className="field-error">
                  Some items changed. <Link to="/cart">Review your cart</Link> before placing the order.
                </p>
              )}
            </OrderSummary>
          )}
        </div>
      </div>
    </div>
  )
}
