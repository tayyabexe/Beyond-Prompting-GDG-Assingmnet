import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'

export function Logo() {
  return (
    <Link to="/" className="logo" aria-label="NEXUS home">
      <span className="logo-mark" aria-hidden="true">N</span>
      NEXUS
    </Link>
  )
}

export default function Header() {
  const { count } = useCart()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [q, setQ] = useState('')
  const navigate = useNavigate()
  const location = useLocation()

  // Close the mobile menu on navigation; keep the search box in sync with the shop URL.
  useEffect(() => {
    setOpen(false)
    setQ(location.pathname === '/shop' ? new URLSearchParams(location.search).get('q') || '' : '')
  }, [location.pathname, location.search])

  // Shadow under the header once the page is scrolled.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Escape closes the mobile menu.
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const search = (e) => {
    e.preventDefault()
    navigate(q.trim() ? `/shop?q=${encodeURIComponent(q.trim())}` : '/shop')
  }

  return (
    <header className={`site-header ${scrolled ? 'scrolled' : ''}`}>
      <div className="container header-row">
        <Logo />
        <nav id="main-nav" className={`main-nav ${open ? 'open' : ''}`} aria-label="Main">
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/shop">Shop</NavLink>
          <NavLink to="/contact">Contact</NavLink>
        </nav>
        <form className="header-search" role="search" onSubmit={search}>
          <label htmlFor="header-q" className="sr-only">Search products</label>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
            <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
          </svg>
          <input id="header-q" type="search" placeholder="Search products…" value={q} maxLength={80} onChange={(e) => setQ(e.target.value)} />
        </form>
        <Link to="/cart" className="cart-link" aria-label={`Cart, ${count} item${count === 1 ? '' : 's'}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M6 7h12l-1 13H7L6 7Z" /><path d="M9 7a3 3 0 0 1 6 0" />
          </svg>
          {/* key={count} re-mounts the badge so it "bumps" every time the cart changes */}
          <span key={count} className={`cart-count ${count ? 'bump' : ''}`} aria-hidden="true">{count}</span>
        </Link>
        <button
          type="button"
          className="menu-btn"
          aria-expanded={open}
          aria-controls="main-nav"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((o) => !o)}
        >
          <span /><span /><span />
        </button>
      </div>
    </header>
  )
}
