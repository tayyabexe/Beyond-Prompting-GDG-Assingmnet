import { Link } from 'react-router-dom'
import { EmptyState, ErrorBox, Loader, StatusBadge } from '../components/ui'
import { dateTime, pkr } from '../lib/format'
import { useTitle } from '../lib/useTitle'
import { useAdminData } from './AdminLayout'

export default function Dashboard() {
  useTitle('Dashboard')
  const stats = useAdminData((api) => api.stats(), [])
  const s = stats.data

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Dashboard</h1>
          <p className="muted">Your store at a glance.</p>
        </div>
        <button type="button" className="btn btn-ghost btn-sm" onClick={stats.reload} disabled={stats.loading}>
          {stats.loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>
      <ErrorBox error={stats.error} onRetry={stats.reload} />
      {!s && stats.loading && <Loader />}
      {s && (
        <>
          <div className="stat-grid stagger">
            <div className="stat" style={{ '--i': 0 }}><span>Total orders</span><strong>{s.total_orders}</strong></div>
            <div className="stat stat-accent" style={{ '--i': 1 }}><span>Revenue</span><strong>{pkr(s.revenue)}</strong><small>excluding cancelled</small></div>
            <Link to="/admin/orders?status=pending" className="stat" style={{ '--i': 2 }}><span>Pending orders</span><strong>{s.pending_orders}</strong><small>need processing →</small></Link>
            <Link to="/admin/inquiries" className="stat" style={{ '--i': 3 }}><span>Open inquiries</span><strong>{s.open_inquiries}</strong><small>not resolved →</small></Link>
          </div>

          <div className="admin-grid">
            <section className="card">
              <div className="card-head">
                <h2>Latest orders</h2>
                <Link to="/admin/orders" className="link-arrow">All orders →</Link>
              </div>
              {s.latest_orders.length ? (
                <div className="table-wrap">
                  <table className="table table-stack">
                    <thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Total</th><th>Status</th></tr></thead>
                    <tbody>
                      {s.latest_orders.map((o) => (
                        <tr key={o.id}>
                          <td data-label="Order"><Link to={`/admin/orders?open=${encodeURIComponent(o.id)}`} className="mono">{o.id}</Link></td>
                          <td data-label="Customer">{o.ship_name}</td>
                          <td data-label="Date" className="nowrap">{dateTime(o.created_at)}</td>
                          <td data-label="Total" className="nowrap">{pkr(o.total)}</td>
                          <td data-label="Status"><StatusBadge status={o.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState title="No orders yet" text="New orders from the store show up here." />
              )}
            </section>

            <section className="card">
              <div className="card-head"><h2>Low stock</h2></div>
              {s.low_stock.length ? (
                <ul className="stock-list">
                  {s.low_stock.map((p) => (
                    <li key={p.id}>
                      <span>{p.name}</span>
                      <span className={`badge ${p.stock === 0 ? 'stock-out' : 'stock-low'}`}>
                        {p.stock === 0 ? 'Out of stock' : `${p.stock} left`}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState title="All stocked up" text="No products are low on stock." />
              )}
            </section>
          </div>
        </>
      )}
    </>
  )
}
