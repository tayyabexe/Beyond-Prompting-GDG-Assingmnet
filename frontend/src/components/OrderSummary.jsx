import { FREE_SHIPPING_FROM, pkr } from '../lib/format'

export default function OrderSummary({ quote, children }) {
  const left = FREE_SHIPPING_FROM - quote.subtotal
  return (
    <aside className="summary" aria-label="Order summary">
      <h2>Order summary</h2>
      <dl>
        <div><dt>Subtotal</dt><dd>{pkr(quote.subtotal)}</dd></div>
        <div><dt>Shipping</dt><dd>{quote.shipping === 0 ? 'Free' : pkr(quote.shipping)}</dd></div>
        <div className="summary-total"><dt>Total</dt><dd>{pkr(quote.total)}</dd></div>
      </dl>
      {quote.subtotal > 0 && left > 0 && (
        <div className="summary-note">
          Add {pkr(left)} more for free shipping.
          <div className="shipping-bar" aria-hidden="true">
            <span style={{ width: `${Math.min(100, (quote.subtotal / FREE_SHIPPING_FROM) * 100)}%` }} />
          </div>
        </div>
      )}
      {quote.subtotal > 0 && left <= 0 && <p className="summary-note ok">You've unlocked free shipping.</p>}
      {children}
    </aside>
  )
}
