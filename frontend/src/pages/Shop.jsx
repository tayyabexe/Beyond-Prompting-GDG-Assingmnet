import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import ProductCard from '../components/ProductCard'
import { EmptyState, ErrorBox, ProductGridSkeleton } from '../components/ui'
import { useAsync } from '../lib/useAsync'
import { useTitle } from '../lib/useTitle'

const CATEGORIES = ['Audio', 'Wearables', 'Home Office', 'Accessories']
const SORTS = [
  ['featured', 'Featured'],
  ['price_asc', 'Price: low to high'],
  ['price_desc', 'Price: high to low'],
  ['name', 'Name: A–Z'],
]

export default function Shop() {
  // Filters live in the URL, so a search can be shared or bookmarked.
  const [params, setParams] = useSearchParams()
  const q = params.get('q') || ''
  const category = params.get('category') || ''
  const sort = params.get('sort') || 'featured'
  useTitle(category || 'Shop')

  const [text, setText] = useState(q)
  useEffect(() => {
    setText(q)
  }, [q])

  // Debounce typing so we don't call the API on every key press.
  useEffect(() => {
    if (text === q) return
    const t = setTimeout(() => update({ q: text.trim() }), 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text])

  const update = (changes) => {
    const next = new URLSearchParams(params)
    Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)))
    if (next.get('sort') === 'featured') next.delete('sort')
    setParams(next, { replace: true })
  }

  const products = useAsync(() => api.products({ q, category, sort }), [q, category, sort])
  const hasFilters = q || category

  return (
    <div className="container page">
      <div className="page-head">
        <h1>{category || 'All products'}</h1>
        <p className="muted">
          {products.data ? `${products.data.length} product${products.data.length === 1 ? '' : 's'}` : ' '}
          {q && <> matching “{q}”</>}
        </p>
      </div>

      <div className="filters">
        <div className="filter-search">
          <label htmlFor="shop-q" className="sr-only">Search</label>
          <input
            id="shop-q"
            type="search"
            placeholder="Search by name or description…"
            value={text}
            maxLength={80}
            onChange={(e) => setText(e.target.value)}
          />
        </div>
        <div className="chips" role="group" aria-label="Category">
          <button type="button" className={`chip ${!category ? 'active' : ''}`} aria-pressed={!category} onClick={() => update({ category: '' })}>
            All
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              className={`chip ${category === c ? 'active' : ''}`}
              aria-pressed={category === c}
              onClick={() => update({ category: c })}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="filter-sort">
          <label htmlFor="shop-sort">Sort</label>
          <select id="shop-sort" value={sort} onChange={(e) => update({ sort: e.target.value })}>
            {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
      </div>

      <ErrorBox error={products.error} onRetry={products.reload} />
      {products.loading && !products.data ? (
        <ProductGridSkeleton />
      ) : products.data?.length ? (
        <div className={`product-grid stagger ${products.loading ? 'is-refreshing' : ''}`} aria-busy={products.loading}>
          {products.data.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>
      ) : (
        !products.error && (
          <EmptyState
            title="No products found"
            text={hasFilters ? 'Try a different search word or category.' : 'The shop is empty right now.'}
            action={
              hasFilters && (
                <button type="button" className="btn btn-primary" onClick={() => setParams({})}>
                  Clear filters
                </button>
              )
            }
          />
        )
      )}
    </div>
  )
}
