import { Link, useNavigate } from 'react-router-dom'
import OrderSummary from '../components/OrderSummary'
import { EmptyState, ErrorBox, Loader, StockBadge } from '../components/ui'
import { useCart } from '../context/CartContext'
import { pkr } from '../lib/format'
import { useQuote } from '../lib/useQuote'
import { useTitle } from '../lib/useTitle'

const ISSUE_TEXT = {
  out_of_stock: 'Out of stock — please remove it.',
  insufficient_stock: (l) => `Only ${l.stock} left — lower the quantity.`,
  not_found: 'This product is no longer available.',
}

export default function Cart() {
  const { items, setQty, remove } = useCart()
  const quote = useQuote()
  const navigate = useNavigate()
  useTitle('Cart')

  if (!items.length) {
    return (
      <div className="container page">
        <h1>Your cart</h1>
        <EmptyState
          title="Your cart is empty"
          text="Find something you like in the shop."
          action={<Link to="/shop" className="btn btn-primary">Start shopping</Link>}
        />
      </div>
    )
  }

  const q = quote.data
  return (
    <div className="container page">
      <h1>Your cart</h1>
      <ErrorBox error={quote.error} onRetry={quote.reload} />
      {!q && quote.loading ? (
        <Loader text="Checking prices and stock…" />
      ) : q ? (
        <div className={`cart-layout ${quote.loading ? 'is-refreshing' : ''}`}>
          <ul className="cart-lines">
            {q.lines.map((l, i) => {
              const issue = l.issue && (typeof ISSUE_TEXT[l.issue] === 'function' ? ISSUE_TEXT[l.issue](l) : ISSUE_TEXT[l.issue])
              return (
                <li key={l.product_id} className={`cart-line ${l.issue ? 'has-issue' : ''}`} style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}>
                  {l.name ? (
                    <Link to={`/product/${l.product_id}`} className="cart-thumb">
                      {l.image_url ? <img src={l.image_url} alt={l.name} loading="lazy" decoding="async" /> : <span>{l.name.charAt(0)}</span>}
                    </Link>
                  ) : (
                    <div className="cart-thumb"><span>?</span></div>
                  )}
                  <div className="cart-line-info">
                    <Link to={`/product/${l.product_id}`} className="cart-line-name">{l.name || l.product_id}</Link>
                    {l.price !== undefined && <span className="muted small">{pkr(l.price)} each</span>}
                    {l.stock_status && <StockBadge status={l.stock_status} stock={l.stock} />}
                    {issue && <span className="field-error">{issue}</span>}
                  </div>
                  <div className="cart-line-actions">
                    {l.name && (
                      <div className="qty qty-sm">
                        <button type="button" onClick={() => setQty(l.product_id, l.qty - 1)} aria-label={`Decrease ${l.name}`}>−</button>
                        <span>{l.qty}</span>
                        <button
                          type="button"
                          onClick={() => setQty(l.product_id, l.qty + 1)}
                          disabled={l.qty >= l.stock}
                          aria-label={`Increase ${l.name}`}
                        >+</button>
                      </div>
                    )}
                    {l.line_total !== undefined && <strong>{pkr(l.line_total)}</strong>}
                    <button type="button" className="link-btn" onClick={() => remove(l.product_id)}>Remove</button>
                  </div>
                </li>
              )
            })}
          </ul>
          <OrderSummary quote={q}>
            {q.has_issues && <p className="field-error">Fix the items marked in red before checking out.</p>}
            <button
              type="button"
              className="btn btn-primary btn-lg btn-block"
              disabled={q.has_issues || quote.loading}
              onClick={() => navigate('/checkout')}
            >
              Go to checkout
            </button>
            <Link to="/shop" className="btn btn-ghost btn-block">Continue shopping</Link>
          </OrderSummary>
        </div>
      ) : null}
    </div>
  )
}
