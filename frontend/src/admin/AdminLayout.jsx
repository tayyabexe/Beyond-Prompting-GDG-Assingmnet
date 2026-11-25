import { useEffect } from 'react'
import { Link, Navigate, NavLink, Outlet, useLocation } from 'react-router-dom'
import { Loader } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useAsync } from '../lib/useAsync'

const svg = (children) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
)
const ICONS = {
  dashboard: svg(<><rect x="3" y="3" width="7" height="9" rx="2" /><rect x="14" y="3" width="7" height="5" rx="2" /><rect x="14" y="12" width="7" height="9" rx="2" /><rect x="3" y="16" width="7" height="5" rx="2" /></>),
  orders: svg(<><path d="M6 7h12l-1 13H7L6 7Z" /><path d="M9 7a3 3 0 0 1 6 0" /></>),
  customers: svg(<><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6" /></>),
  inquiries: svg(<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z" />),
}

// Admin data loader: logs the merchant out if the token has expired (401).
export function useAdminData(loader, deps) {
  const { api, signOut } = useAuth()
  const result = useAsync(() => loader(api), [api, ...deps])
  useEffect(() => {
    if (result.error?.status === 401) signOut()
  }, [result.error, signOut])
  return result
}

export default function AdminLayout() {
  const { checking, isAdmin, email, signOut } = useAuth()
  const location = useLocation()

  if (checking) return <div className="admin-center"><Loader text="Checking your session…" /></div>
  if (!isAdmin) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />

  return (
    <div className="admin">
      <a href="#admin-main" className="skip-link">Skip to content</a>
      <aside className="admin-side">
        <Link to="/admin" className="logo logo-light">
          <span className="logo-mark" aria-hidden="true">N</span>NEXUS <small>CRM</small>
        </Link>
        <nav aria-label="Admin">
          <NavLink to="/admin" end>{ICONS.dashboard}Dashboard</NavLink>
          <NavLink to="/admin/orders">{ICONS.orders}Orders</NavLink>
          <NavLink to="/admin/customers">{ICONS.customers}Customers</NavLink>
          <NavLink to="/admin/inquiries">{ICONS.inquiries}Inquiries</NavLink>
        </nav>
        <div className="admin-side-foot">
          <Link to="/" className="admin-store-link">View store ↗</Link>
          <span className="admin-email" title={email}>{email}</span>
          <button type="button" className="btn btn-ghost btn-sm btn-block" onClick={signOut}>Log out</button>
        </div>
      </aside>
      <main id="admin-main" className="admin-main">
        <Outlet />
      </main>
    </div>
  )
}
