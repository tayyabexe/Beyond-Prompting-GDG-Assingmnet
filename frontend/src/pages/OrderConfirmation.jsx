import { Link } from 'react-router-dom'
import { EmptyState } from '../components/ui'
import { dateTime, label, pkr } from '../lib/format'
import { useTitle } from '../lib/useTitle'

// Uses the POST /orders response saved in sessionStorage. There is no public
// "get order by ID" endpoint on purpose (order IDs are sequential).
function readOrder() {
  try {
    return JSON.parse(sessionStorage.getItem('nexus-last-order'))
  } catch {
    return null
  }
}

export default function OrderConfirmation() {
  const order = readOrder()
  useTitle(order ? `Order ${order.id} confirmed` : 'Order confirmation')
  if (!order) {
    return (
      <div className="container page">
        <EmptyState
          title="No recent order"
          text="Your order confirmation shows here right after checkout."
          action={<Link to="/shop" className="btn btn-primary">Go to the shop</Link>}
        />
      </div>
    )
  }

  return (
    <div className="container page confirm">
      <div className="confirm-head">
        <span className="confirm-check" aria-hidden="true">✓</span>
        <h1>Thank you, {order.name.split(' ')[0]}!</h1>
        <p className="lead">Your order has been placed.</p>
        <p className="order-id">Order ID <strong>{order.id}</strong></p>
      </div>

      <div className="card confirm-card">
        <dl className="confirm-meta">
          <div><dt>Placed</dt><dd>{dateTime(order.created_at)}</dd></div>
          <div><dt>Status</dt><dd>{label(order.status)}</dd></div>
          <div><dt>Payment</dt><dd>{label(order.payment)}</dd></div>
          <div><dt>Delivering to</dt><dd>{order.city}</dd></div>
        </dl>
        <ul className="summary-lines">
          {order.items.map((i) => (
            <li key={i.product_id}>
              <span>{i.name} × {i.qty}</span>
              <span>{pkr(i.price * i.qty)}</span>
            </li>
          ))}
        </ul>
        <dl className="confirm-totals">
          <div><dt>Subtotal</dt><dd>{pkr(order.subtotal)}</dd></div>
          <div><dt>Shipping</dt><dd>{order.shipping === 0 ? 'Free' : pkr(order.shipping)}</dd></div>
          <div className="summary-total"><dt>Total</dt><dd>{pkr(order.total)}</dd></div>
        </dl>
        <p className="muted small">A confirmation would be sent to {order.email}. Keep your order ID for any questions.</p>
      </div>

      <div className="hero-actions center">
        <Link to="/shop" className="btn btn-primary">Continue shopping</Link>
        <Link to="/contact" className="btn btn-ghost">Contact us about this order</Link>
      </div>
    </div>
  )
}
