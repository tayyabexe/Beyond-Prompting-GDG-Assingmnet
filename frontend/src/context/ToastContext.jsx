// Small pop-up messages ("Added to cart", "Status updated"). Max 3 on screen, each disappears after ~3s.
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

const ToastContext = createContext(() => {})
const LIFETIME_MS = 3200

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef(new Set())
  const nextId = useRef(0)

  useEffect(() => {
    const all = timers.current
    return () => all.forEach(clearTimeout)
  }, [])

  const show = useCallback((message, action = null) => {
    const id = ++nextId.current
    setToasts((list) => [...list.slice(-2), { id, message, action }])
    const t = setTimeout(() => {
      setToasts((list) => list.filter((x) => x.id !== id))
      timers.current.delete(t)
    }, LIFETIME_MS)
    timers.current.add(t)
  }, [])

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className="toast">
            <span>{t.message}</span>
            {t.action}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
