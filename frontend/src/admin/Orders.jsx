import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { EmptyState, ErrorBox, Loader, StatusBadge } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { dateTime, label, ORDER_STATUSES, pkr } from '../lib/format'
import { useTitle } from '../lib/useTitle'
import { useAdminData } from './AdminLayout'

function OrderDetail({ id, onClose, onChanged }) {
  const { api } = useAuth()
  const toast = useToast()
  const order = useAdminData((a) => a.order(id), [id])
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState(null)

  // Escape closes the drawer; the page behind it doesn't scroll while it's open.
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') closeRef.current()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [])

  const change = async (status) => {
    if (status === 'cancelled' && !window.confirm(`Cancel order ${id}? Its items will go back into stock.`)) return
    setBusy(status)
    setError(null)
    try {
      const updated = await api.setOrderStatus(id, status)
      order.setData(updated)
      onChanged()
      toast(`${id} is now ${label(status).toLowerCase()}`)
    } catch (err) {
      setError(err)
      order.reload() // someone else may have changed it: show the real status
    } finally {
      setBusy(null)
    }
  }

  const o = order.data
  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside className="drawer" role="dialog" aria-modal="true" aria-label={`Order ${id}`} onClick={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          <h2 className="mono">{id}</h2>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} autoFocus>Close</button>
        </div>
        <ErrorBox error={order.error} onRetry={order.reload} />
        {!o && order.loading && <Loader />}
        {o && (
          <>
            <div className="drawer-status">
              <StatusBadge status={o.status} />
              <span className="muted small">Placed {dateTime(o.created_at)}</span>
            </div>

            <section>
              <h3>Change status</h3>
              {o.next_statuses.length ? (
                <div className="status-actions">
                  {o.next_statuses.map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={`btn btn-sm ${s === 'cancelled' ? 'btn-danger' : 'btn-primary'}`}
                      disabled={Boolean(busy)}
                      onClick={() => change(s)}
                    >
                      {busy === s ? 'Saving…' : s === 'cancelled' ? 'Cancel order' : `Mark as ${label(s).toLowerCase()}`}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="muted small">This order is {o.status}; no further changes are allowed.</p>
              )}
              <ErrorBox error={error} />
            </section>

            <section>
              <h3>Customer</h3>
              <p>
                <strong>{o.ship_name}</strong><br />
                {o.ship_email}<br />
                {o.ship_phone}<br />
                {o.ship_address}, {o.ship_city}
              </p>
              <p className="muted small">Payment: {label(o.payment)}</p>
            </section>

            <section>
              <h3>Items</h3>
              <ul className="summary-lines">
                {o.items.map((i) => (
                  <li key={i.id}><span>{i.product_name} × {i.qty}</span><span>{pkr(i.unit_price * i.qty)}</span></li>
                ))}
              </ul>
              <dl className="confirm-totals">
                <div><dt>Subtotal</dt><dd>{pkr(o.subtotal)}</dd></div>
                <div><dt>Shipping</dt><dd>{o.shipping === 0 ? 'Free' : pkr(o.shipping)}</dd></div>
                <div className="summary-total"><dt>Total</dt><dd>{pkr(o.total)}</dd></div>
              </dl>
            </section>

            <section>
              <h3>History</h3>
              <ol className="timeline">
                {o.history?.map((h) => (
                  <li key={h.id}><StatusBadge status={h.status} /><span className="muted small">{dateTime(h.changed_at)}</span></li>
                ))}
              </ol>
            </section>
          </>
        )}
      </aside>
    </div>
  )
}

export default function Orders() {
  const [params, setParams] = useSearchParams()
  const status = params.get('status') || ''
  const openId = params.get('open')
  useTitle(openId ? `Order ${openId}` : 'Orders')
  const orders = useAdminData((api) => api.orders(status), [status])

  const setParam = (key, value) => {
    const next = new URLSearchParams(params)
    value ? next.set(key, value) : next.delete(key)
    setParams(next, { replace: true })
  }

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Orders</h1>
          <p className="muted">Click an order to see details and update its status.</p>
        </div>
        <button type="button" className="btn btn-ghost btn-sm" onClick={orders.reload} disabled={orders.loading}>
          {orders.loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      <div className="chips" role="group" aria-label="Filter by status">
        <button type="button" className={`chip ${!status ? 'active' : ''}`} aria-pressed={!status} onClick={() => setParam('status', '')}>All</button>
        {ORDER_STATUSES.map((s) => (
          <button key={s} type="button" className={`chip ${status === s ? 'active' : ''}`} aria-pressed={status === s} onClick={() => setParam('status', s)}>
            {label(s)}
          </button>
        ))}
      </div>

      <ErrorBox error={orders.error} onRetry={orders.reload} />
      {!orders.data && orders.loading ? (
        <Loader />
      ) : orders.data?.length ? (
        <div className="card table-wrap">
          <table className="table table-click table-stack">
            <thead>
              <tr><th>Order</th><th>Date</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th></tr>
            </thead>
            <tbody>
              {orders.data.map((o) => (
                <tr key={o.id} onClick={() => setParam('open', o.id)}>
                  <td data-label="Order">
                    <button type="button" className="link-btn mono" onClick={(e) => { e.stopPropagation(); setParam('open', o.id) }}>
                      {o.id}
                    </button>
                  </td>
                  <td data-label="Date" className="nowrap">{dateTime(o.created_at)}</td>
                  <td data-label="Customer"><span>{o.ship_name}<br /><span className="muted small">{o.ship_city}</span></span></td>
                  <td data-label="Items">{o.items.reduce((n, i) => n + i.qty, 0)}</td>
                  <td data-label="Total" className="nowrap">{pkr(o.total)}</td>
                  <td data-label="Status"><StatusBadge status={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        !orders.error && (
          <EmptyState title={status ? `No ${label(status).toLowerCase()} orders` : 'No orders yet'} text="Orders placed in the store appear here straight away." />
        )
      )}

      {openId && <OrderDetail id={openId} onClose={() => setParam('open', '')} onChanged={orders.reload} />}
    </>
  )
}
