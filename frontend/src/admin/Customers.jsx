import { useDeferredValue, useMemo, useState } from 'react'
import { EmptyState, ErrorBox, Loader } from '../components/ui'
import { dateOnly, pkr } from '../lib/format'
import { useTitle } from '../lib/useTitle'
import { useAdminData } from './AdminLayout'

export default function Customers() {
  useTitle('Customers')
  const customers = useAdminData((api) => api.customers(), [])
  const [q, setQ] = useState('')

  // Typing stays smooth: the list filters with the "deferred" text, and only when it or the data changes.
  const term = useDeferredValue(q.trim().toLowerCase())
  const list = useMemo(
    () =>
      (customers.data || []).filter(
        (c) => !term || [c.name, c.email, c.city, c.phone].some((v) => (v || '').toLowerCase().includes(term)),
      ),
    [customers.data, term],
  )

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Customers</h1>
          <p className="muted">Everyone who has placed an order.</p>
        </div>
        <div className="filter-search">
          <label htmlFor="cust-q" className="sr-only">Search customers</label>
          <input id="cust-q" type="search" placeholder="Search name, email, city…" value={q} maxLength={80} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      <ErrorBox error={customers.error} onRetry={customers.reload} />
      {!customers.data && customers.loading ? (
        <Loader />
      ) : list.length ? (
        <div className="card table-wrap">
          <table className="table table-stack">
            <thead>
              <tr><th>Name</th><th>Email</th><th>Phone</th><th>City</th><th>Orders</th><th>Total spent</th><th>Last order</th></tr>
            </thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.id}>
                  <td data-label="Name"><strong>{c.name}</strong></td>
                  <td data-label="Email">{c.email}</td>
                  <td data-label="Phone" className="nowrap">{c.phone}</td>
                  <td data-label="City">{c.city}</td>
                  <td data-label="Orders">{c.order_count}</td>
                  <td data-label="Total spent" className="nowrap">{pkr(c.total_spent)}</td>
                  <td data-label="Last order" className="nowrap">{dateOnly(c.last_order_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        !customers.error && (
          <EmptyState
            title={term ? 'No matching customers' : 'No customers yet'}
            text={term ? 'Try a different search.' : 'Customers are added automatically when they place an order.'}
          />
        )
      )}
    </>
  )
}
