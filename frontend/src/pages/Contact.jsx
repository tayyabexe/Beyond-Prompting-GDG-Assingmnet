import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api, ApiError } from '../api/client'
import { ErrorBox, Field } from '../components/ui'
import { useAsync } from '../lib/useAsync'
import { useTitle } from '../lib/useTitle'
import { validateInquiry } from '../lib/validation'

export default function Contact() {
  const [params] = useSearchParams()
  const products = useAsync(() => api.products({ sort: 'name' }), [])
  const [form, setForm] = useState({
    name: '', email: '', subject: '', message: '', product_id: params.get('product') || '',
  })
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState(null)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(null)
  useTitle(sent ? 'Message sent' : 'Contact')

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    if (errors[key]) setErrors((er) => ({ ...er, [key]: undefined }))
  }

  const submit = async (e) => {
    e.preventDefault()
    setSubmitError(null)
    const found = validateInquiry(form)
    setErrors(found)
    if (Object.keys(found).length) {
      document.getElementById(Object.keys(found)[0])?.focus()
      return
    }
    setSending(true)
    try {
      const res = await api.sendInquiry({
        name: form.name.trim(),
        email: form.email.trim(),
        subject: form.subject.trim(),
        message: form.message.trim(),
        product_id: form.product_id || null,
      })
      setSent(res)
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors) setErrors(err.fieldErrors)
      setSubmitError(err)
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return (
      <div className="container page confirm">
        <div className="confirm-head">
          <span className="confirm-check" aria-hidden="true">✓</span>
          <h1>Message sent</h1>
          <p className="lead">Thanks! We'll get back to you by email.</p>
          <p className="order-id">Reference <strong>{sent.id}</strong></p>
        </div>
        <div className="hero-actions center">
          <Link to="/shop" className="btn btn-primary">Back to the shop</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container page">
      <div className="contact-layout">
        <div className="contact-intro">
          <span className="eyebrow">Contact</span>
          <h1>How can we help?</h1>
          <p className="lead">Questions about a product, an order or delivery? Send us a message and we'll reply by email.</p>
          <ul className="perks">
            <li>We usually reply within one working day</li>
            <li>Mention your order ID (e.g. NX-1001) if it's about an order</li>
          </ul>
        </div>

        <form className="card form" onSubmit={submit} noValidate>
          <div className="form-grid">
            <Field id="name" label="Your name" value={form.name} onChange={set('name')} error={errors.name} autoComplete="name" maxLength={60} />
            <Field id="email" label="Email" type="email" value={form.email} onChange={set('email')} error={errors.email} autoComplete="email" />
          </div>
          <Field id="product_id" label="Product (optional)" error={errors.product_id}>
            <select id="product_id" value={form.product_id} onChange={set('product_id')} aria-invalid={Boolean(errors.product_id)}>
              <option value="">Not about a specific product</option>
              {products.data?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
          <Field id="subject" label="Subject" value={form.subject} onChange={set('subject')} error={errors.subject} maxLength={100} />
          <Field
            id="message"
            label="Message"
            as="textarea"
            rows={5}
            value={form.message}
            onChange={set('message')}
            error={errors.message}
            hint={`${form.message.trim().length}/1000 characters (at least 10)`}
            maxLength={1000}
          />
          <ErrorBox error={submitError} />
          <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={sending}>
            {sending ? 'Sending…' : 'Send message'}
          </button>
        </form>
      </div>
    </div>
  )
}
