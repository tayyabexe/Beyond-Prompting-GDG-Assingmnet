import { Link } from 'react-router-dom'
import { api } from '../api/client'
import ProductCard, { ProductImage } from '../components/ProductCard'
import { EmptyState, ErrorBox, ProductGridSkeleton } from '../components/ui'
import { useAsync } from '../lib/useAsync'
import { useTitle } from '../lib/useTitle'

const CATEGORY_TEXT = {
  Audio: 'Headphones, earbuds & speakers',
  Wearables: 'Watches, bands & rings',
  'Home Office': 'Chairs, lamps & keyboards',
  Accessories: 'Bags, power & cables',
}

const icon = (path) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {path}
  </svg>
)
const CATEGORY_ICON = {
  Audio: icon(<><path d="M4 14v-2a8 8 0 0 1 16 0v2" /><rect x="3" y="14" width="5" height="7" rx="2" /><rect x="16" y="14" width="5" height="7" rx="2" /></>),
  Wearables: icon(<><rect x="6" y="6" width="12" height="12" rx="3" /><path d="M9 6V2h6v4M9 18v4h6v-4M12 10v2l1.5 1.5" /></>),
  'Home Office': icon(<><path d="M9 3h6l2 7H7l2-7ZM12 10v8M8 21h8" /></>),
  Accessories: icon(<><path d="M6 8h12l-1 12H7L6 8Z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></>),
}

const PERKS = [
  'Free shipping on orders over Rs 10,000',
  'Cash on Delivery nationwide',
  'Real stock shown on every product',
  'Openly licensed product photos',
  'Questions answered within a day',
]

export default function Home() {
  useTitle('')
  const featured = useAsync(() => api.products({ featured: true }), [])
  const categories = useAsync(() => api.categories(), [])
  const hero = featured.data?.slice(0, 3) || []

  return (
    <>
      <section className="hero container">
        <div className="hero-copy">
          <span className="pill"><span className="pill-dot" aria-hidden="true" />New season · Free shipping over Rs 10,000</span>
          <h1>
            Gear that keeps <span className="accent">up with you.</span>
          </h1>
          <p className="lead">
            Headphones, wearables and workspace essentials — picked for everyday use and delivered
            across Pakistan with Cash on Delivery.
          </p>
          <div className="hero-actions">
            <Link to="/shop" className="btn btn-primary btn-lg">Shop now</Link>
            <Link to="/contact" className="btn btn-ghost btn-lg">Ask a question</Link>
          </div>
          <ul className="hero-points">
            <li><strong>COD</strong> Pay when it arrives</li>
            <li><strong>Rs 250</strong> Flat shipping</li>
            <li><strong>12</strong> Hand-picked products</li>
          </ul>
        </div>
        <div className="hero-art">
          {hero.length
            ? hero.map((p, i) => (
                <Link key={p.id} to={`/product/${p.id}`} className={`hero-tile hero-tile-${i}`}>
                  <ProductImage product={p} eager priority={i === 0} />
                  <span className="hero-tile-label">{p.name}</span>
                </Link>
              ))
            : featured.loading && [0, 1, 2].map((i) => <div key={i} className={`hero-tile hero-tile-${i} skeleton`} aria-hidden="true" />)}
        </div>
      </section>

      <div className="ticker">
        <div className="ticker-track">
          {[...PERKS, ...PERKS].map((p, i) => (
            <span key={i} aria-hidden={i >= PERKS.length || undefined}>{p}</span>
          ))}
        </div>
      </div>

      <section className="container section">
        <div className="section-head">
          <h2>Shop by category</h2>
          <Link to="/shop" className="link-arrow">All products →</Link>
        </div>
        <ErrorBox error={categories.error} onRetry={categories.reload} />
        <div className="category-grid stagger">
          {categories.data
            ? categories.data.map((c, i) => (
                <Link key={c.name} to={`/shop?category=${encodeURIComponent(c.name)}`} className="category-tile" style={{ '--i': i }}>
                  <div className="category-top">
                    <span className="category-icon">{CATEGORY_ICON[c.name]}</span>
                    <span className="category-count">{c.count} items</span>
                  </div>
                  <h3>{c.name}</h3>
                  <p>{CATEGORY_TEXT[c.name]}</p>
                </Link>
              ))
            : categories.loading && [0, 1, 2, 3].map((i) => <div key={i} className="category-tile skeleton" style={{ minHeight: 150 }} aria-hidden="true" />)}
        </div>
      </section>

      <section className="container section">
        <div className="section-head">
          <h2>Featured picks</h2>
          <Link to="/shop" className="link-arrow">See everything →</Link>
        </div>
        <ErrorBox error={featured.error} onRetry={featured.reload} />
        {featured.loading && !featured.data ? (
          <ProductGridSkeleton count={4} />
        ) : featured.data?.length ? (
          <div className="product-grid stagger">
            {featured.data.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        ) : (
          !featured.error && <EmptyState title="No featured products yet" text="Check the full shop instead." />
        )}
      </section>

      <section className="container section">
        <div className="promo">
          <div>
            <h2>Not sure what to pick?</h2>
            <p>Send us a message — we usually reply within a day.</p>
          </div>
          <Link to="/contact" className="btn btn-light btn-lg">Contact us</Link>
        </div>
      </section>
    </>
  )
}
