import { label } from '../lib/format'

export function Loader({ text = 'Loading…' }) {
  return (
    <div className="loader" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      {text}
    </div>
  )
}

// Grey placeholder cards with a shimmer while products load (feels faster than a spinner).
export function ProductGridSkeleton({ count = 8, text = 'Loading products…' }) {
  return (
    <>
      <p className="sr-only" role="status">{text}</p>
      <div className="product-grid" aria-hidden="true">
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className="product-card skeleton-card">
            <div className="product-img skeleton" />
            <div className="sk-line skeleton" />
            <div className="sk-line sk-short skeleton" />
          </div>
        ))}
      </div>
    </>
  )
}

export function ErrorBox({ error, onRetry }) {
  if (!error) return null
  return (
    <div className="alert alert-error" role="alert">
      <span>{error.message || String(error)}</span>
      {onRetry && (
        <button type="button" className="btn btn-ghost btn-sm" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  )
}

export function EmptyState({ title, text, action }) {
  return (
    <div className="empty">
      <div className="empty-icon" aria-hidden="true">◌</div>
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {action}
    </div>
  )
}

// Backend sends in_stock / low_stock / out_of_stock (backend/app/pricing.py).
const STOCK = {
  in_stock: ['In stock', 'stock-in'],
  low_stock: ['Low stock', 'stock-low'],
  out_of_stock: ['Out of stock', 'stock-out'],
}

export function StockBadge({ status, stock }) {
  const [text, cls] = STOCK[status] || [status, '']
  return <span className={`badge ${cls}`}>{status === 'low_stock' && stock ? `Only ${stock} left` : text}</span>
}

export function StatusBadge({ status }) {
  return <span className={`badge status-${status}`}>{label(status)}</span>
}

// Labelled input with an inline error (aria-invalid + aria-describedby for screen readers).
export function Field({ id, label: text, error, hint, as = 'input', children, ...props }) {
  const Tag = as
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined
  return (
    <div className={`field ${error ? 'has-error' : ''}`}>
      <label htmlFor={id}>{text}</label>
      {children || <Tag id={id} name={id} aria-invalid={Boolean(error)} aria-describedby={describedBy} {...props} />}
      {hint && !error && (
        <small id={`${id}-hint`} className="hint">
          {hint}
        </small>
      )}
      {error && (
        <small id={`${id}-error`} className="field-error">
          {error}
        </small>
      )}
    </div>
  )
}
