import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { EmptyState, ErrorBox, Field, Loader, StatusBadge } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { dateTime, INQUIRY_STATUSES, label } from '../lib/format'
import { useTitle } from '../lib/useTitle'
import { validateNote } from '../lib/validation'
import { useAdminData } from './AdminLayout'

function InquiryPanel({ inquiry, onUpdated }) {
  const { api } = useAuth()
  const toast = useToast()
  const [note, setNote] = useState('')
  const [noteError, setNoteError] = useState(null)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const run = async (fn, done) => {
    setBusy(true)
    setError(null)
    try {
      onUpdated(await fn())
      toast(done)
      return true
    } catch (err) {
      setError(err)
      return false
    } finally {
      setBusy(false)
    }
  }

  const addNote = async (e) => {
    e.preventDefault()
    const err = validateNote(note)
    setNoteError(err)
    if (err) return
    if (await run(() => api.addNote(inquiry.id, note.trim()), 'Note added')) setNote('')
  }

  return (
    <article className="card inquiry-panel">
      <div className="card-head">
        <div>
          <span className="mono muted small">{inquiry.id}</span>
          <h2>{inquiry.subject}</h2>
        </div>
        <StatusBadge status={inquiry.status} />
      </div>
      <p className="muted small">
        From <strong>{inquiry.name}</strong> ({inquiry.email}) · {dateTime(inquiry.created_at)}
        {inquiry.product_name && <> · About <strong>{inquiry.product_name}</strong></>}
      </p>
      <blockquote className="inquiry-message">{inquiry.message}</blockquote>

      <div className="field">
        <label htmlFor="inq-status">Status</label>
        <select
          id="inq-status"
          value={inquiry.status}
          disabled={busy}
          onChange={(e) => {
            const status = e.target.value
            run(() => api.setInquiryStatus(inquiry.id, status), `${inquiry.id} marked as ${label(status).toLowerCase()}`)
          }}
        >
          {INQUIRY_STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}
        </select>
      </div>

      <h3>Internal notes</h3>
      {inquiry.notes.length ? (
        <ul className="notes">
          {inquiry.notes.map((n) => (
            <li key={n.id}><p>{n.note}</p><span className="muted small">{dateTime(n.created_at)}</span></li>
          ))}
        </ul>
      ) : (
        <p className="muted small">No notes yet. Notes are only visible to the team.</p>
      )}
      <form onSubmit={addNote} noValidate className="note-form">
        <Field
          id="note"
          label="Add a note"
          as="textarea"
          rows={2}
          value={note}
          maxLength={500}
          onChange={(e) => { setNote(e.target.value); setNoteError(null) }}
          error={noteError}
          hint={`${note.trim().length}/500`}
        />
        <button type="submit" className="btn btn-primary btn-sm" disabled={busy}>{busy ? 'Saving…' : 'Add note'}</button>
      </form>
      <ErrorBox error={error} />
    </article>
  )
}

export default function Inquiries() {
  const [params, setParams] = useSearchParams()
  const status = params.get('status') || ''
  useTitle('Inquiries')
  const inquiries = useAdminData((api) => api.inquiries(status), [status])
  const [selectedId, setSelectedId] = useState(null)

  const list = inquiries.data || []
  const selected = list.find((i) => i.id === selectedId) || list[0]

  const setStatus = (s) => {
    setSelectedId(null)
    setParams(s ? { status: s } : {}, { replace: true })
  }

  const updated = (inq) => {
    // Keep the list in sync; if it no longer matches the filter it stays until the next refresh.
    inquiries.setData(list.map((i) => (i.id === inq.id ? inq : i)))
  }

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Inquiries</h1>
          <p className="muted">Customer questions from the contact form and product pages.</p>
        </div>
        <button type="button" className="btn btn-ghost btn-sm" onClick={inquiries.reload} disabled={inquiries.loading}>
          {inquiries.loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      <div className="chips" role="group" aria-label="Filter by status">
        <button type="button" className={`chip ${!status ? 'active' : ''}`} aria-pressed={!status} onClick={() => setStatus('')}>All</button>
        {INQUIRY_STATUSES.map((s) => (
          <button key={s} type="button" className={`chip ${status === s ? 'active' : ''}`} aria-pressed={status === s} onClick={() => setStatus(s)}>
            {label(s)}
          </button>
        ))}
      </div>

      <ErrorBox error={inquiries.error} onRetry={inquiries.reload} />
      {!inquiries.data && inquiries.loading ? (
        <Loader />
      ) : list.length ? (
        <div className="inquiry-layout">
          <ul className="inquiry-list" aria-label="Inquiries">
            {list.map((i) => (
              <li key={i.id}>
                <button
                  type="button"
                  className={`inquiry-item ${selected?.id === i.id ? 'active' : ''}`}
                  aria-current={selected?.id === i.id}
                  onClick={() => setSelectedId(i.id)}
                >
                  <span className="inquiry-item-top">
                    <strong>{i.name}</strong>
                    <StatusBadge status={i.status} />
                  </span>
                  <span className="inquiry-item-subject">{i.subject}</span>
                  <span className="muted small">{i.id} · {dateTime(i.created_at)}</span>
                </button>
              </li>
            ))}
          </ul>
          {selected && <InquiryPanel key={selected.id} inquiry={selected} onUpdated={updated} />}
        </div>
      ) : (
        !inquiries.error && (
          <EmptyState
            title={status ? `No ${label(status).toLowerCase()} inquiries` : 'No inquiries yet'}
            text="Messages from the contact form appear here."
          />
        )
      )}
    </>
  )
}
