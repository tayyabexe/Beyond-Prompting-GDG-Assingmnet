import { useEffect, useState } from 'react'
import { onSlowChange } from '../api/client'

// Shown when any API call takes more than a few seconds — usually the free Render
// server waking up after being idle.
export default function ServerWakeNotice() {
  const [slow, setSlow] = useState(false)
  useEffect(() => {
    const unsubscribe = onSlowChange(setSlow)
    return () => {
      unsubscribe()
    }
  }, [])
  if (!slow) return null
  return (
    <div className="wake-notice" role="status" aria-live="polite">
      <span className="spinner spinner-light" aria-hidden="true" />
      Waking up the server… the first load can take up to a minute.
    </div>
  )
}
