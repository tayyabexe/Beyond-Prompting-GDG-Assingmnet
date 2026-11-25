import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import { pkr } from '../lib/format'
import { StockBadge } from './ui'

// Fades in once loaded; if the image fails, shows the first letter instead of a broken-image icon.
export function ProductImage({ product, className = '', eager = false, priority = false }) {
  const [state, setState] = useState('loading')
  const showImage = product.image_url && state !== 'failed'
  return (
    <div className={`product-img ${className} ${state === 'loading' && showImage ? 'skeleton' : ''}`}>
      {showImage ? (
        <img
          src={product.image_url}
          alt={product.name}
          loading={eager || priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : undefined}
          decoding="async"
          className={state === 'loaded' ? 'loaded' : ''}
          onLoad={() => setState('loaded')}
          onError={() => setState('failed')}
        />
      ) : (
        <span className="img-placeholder" aria-hidden="true">{product.name.charAt(0)}</span>
      )}
    </div>
  )
}

export default function ProductCard({ product, index = 0 }) {
  const { add, qtyOf } = useCart()
  const toast = useToast()
  const inCart = qtyOf(product.id)
  const canAdd = product.stock > inCart

  const addOne = () => {
    add(product.id, 1)
    toast(<>Added <strong>{product.name}</strong></>, <Link to="/cart">View cart</Link>)
  }

  return (
    <article className="product-card" style={{ '--i': index }}>
      <Link to={`/product/${product.id}`} className="product-card-link">
        <ProductImage product={product} />
        <div className="product-card-body">
          <span className="eyebrow">{product.category}</span>
          <h3 title={product.name}>{product.name}</h3>
        </div>
      </Link>
      <div className="product-card-foot">
        <div>
          <strong className="price">{pkr(product.price)}</strong>
          <StockBadge status={product.stock_status} stock={product.stock} />
        </div>
        <button
          type="button"
          className="btn btn-icon"
          disabled={!canAdd}
          onClick={addOne}
          aria-label={canAdd ? `Add ${product.name} to cart` : `${product.name} unavailable`}
          title={canAdd ? 'Add to cart' : product.stock === 0 ? 'Out of stock' : 'All available stock is in your cart'}
        >
          +
        </button>
      </div>
    </article>
  )
}
