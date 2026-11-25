import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client'
import { ProductImage } from '../components/ProductCard'
import { ErrorBox, StockBadge } from '../components/ui'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import { pkr, FREE_SHIPPING_FROM } from '../lib/format'
import { useAsync } from '../lib/useAsync'
import { useTitle } from '../lib/useTitle'
import NotFound from './NotFound'

function DetailSkeleton() {
  return (
    <div className="detail" aria-hidden="true">
      <div className="product-img product-img-lg skeleton" />
      <div>
        <div className="sk-line skeleton" style={{ width: '25%', margin: '8px 0 18px' }} />
        <div className="sk-line skeleton" style={{ height: 40, width: '80%', margin: '0 0 14px' }} />
        <div className="sk-line skeleton" style={{ height: 28, width: '35%', margin: '0 0 24px' }} />
        <div className="sk-line skeleton" style={{ margin: '0 0 10px' }} />
        <div className="sk-line skeleton" style={{ width: '70%', margin: 0 }} />
      </div>
    </div>
  )
}

export default function ProductDetail() {
  const { id } = useParams()
  const product = useAsync(() => api.product(id), [id])
  const { add, qtyOf } = useCart()
  const toast = useToast()
  const [qty, setQty] = useState(1)
  useTitle(product.data?.name || 'Product')

  if (product.error?.status === 404) {
    return <NotFound title="Product not found" text="This product doesn't exist or was removed." />
  }
  if (product.loading && !product.data) {
    return (
      <div className="container page">
        <p className="sr-only" role="status">Loading product…</p>
        <DetailSkeleton />
      </div>
    )
  }
  if (product.error) return <div className="container page"><ErrorBox error={product.error} onRetry={product.reload} /></div>

  const p = product.data
  const inCart = qtyOf(p.id)
  const maxAdd = Math.max(0, p.stock - inCart)

  const addToCart = () => {
    const n = Math.min(qty, maxAdd)
    add(p.id, n)
    setQty(1)
    toast(<>Added {n} × <strong>{p.name}</strong></>, <Link to="/cart">View cart</Link>)
  }

  return (
    <div className="container page">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/shop">Shop</Link> / <Link to={`/shop?category=${encodeURIComponent(p.category)}`}>{p.category}</Link> / <span>{p.name}</span>
      </nav>

      <div className="detail">
        <figure className="detail-media">
          <ProductImage product={p} className="product-img-lg" eager />
          {p.image_credit && <figcaption className="credit">Photo: {p.image_credit}</figcaption>}
        </figure>

        <div className="detail-info">
          <span className="eyebrow">{p.category}</span>
          <h1>{p.name}</h1>
          <div className="detail-price">
            <strong>{pkr(p.price)}</strong>
            <StockBadge status={p.stock_status} stock={p.stock} />
          </div>
          <p className="detail-desc">{p.description}</p>

          {p.stock > 0 ? (
            <div className="buy-box">
              <div className="qty" role="group" aria-label="Quantity">
                <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1 || maxAdd === 0} aria-label="Decrease quantity">−</button>
                <span aria-live="polite">{maxAdd === 0 ? 0 : qty}</span>
                <button type="button" onClick={() => setQty((q) => Math.min(maxAdd, q + 1))} disabled={qty >= maxAdd} aria-label="Increase quantity">+</button>
              </div>
              <button type="button" className="btn btn-primary btn-lg grow" onClick={addToCart} disabled={maxAdd === 0}>
                {maxAdd === 0 ? 'All stock is in your cart' : 'Add to cart'}
              </button>
            </div>
          ) : (
            <p className="alert alert-warn">This product is out of stock right now.</p>
          )}

          {inCart > 0 && (
            <p className="muted small">
              You have {inCart} in your cart. <Link to="/cart">View cart →</Link>
            </p>
          )}

          <ul className="perks">
            <li>Free shipping on orders of {pkr(FREE_SHIPPING_FROM)} or more (otherwise Rs 250)</li>
            <li>Cash on Delivery available nationwide</li>
          </ul>

          <Link to={`/contact?product=${encodeURIComponent(p.id)}`} className="link-arrow">
            Have a question about this product? →
          </Link>
        </div>
      </div>
    </div>
  )
}
