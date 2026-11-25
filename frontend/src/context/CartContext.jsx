// The cart only stores {product_id, qty} in localStorage (kept after refresh).
// Prices, stock and totals always come from POST /cart/quote, never from the browser.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const KEY = 'nexus-cart'
const CartContext = createContext(null)

function load() {
  try {
    const items = JSON.parse(localStorage.getItem(KEY) || '[]')
    return Array.isArray(items)
      ? items.filter((i) => typeof i.product_id === 'string' && Number.isInteger(i.qty) && i.qty > 0)
      : []
  } catch {
    return []
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(load)

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(items))
  }, [items])

  // Store open in two tabs: a change in one tab shows up in the other instead of being overwritten.
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === KEY) setItems(load())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const add = useCallback((productId, qty = 1) => {
    setItems((cur) => {
      const found = cur.find((i) => i.product_id === productId)
      if (found) {
        return cur.map((i) => (i.product_id === productId ? { ...i, qty: Math.min(99, i.qty + qty) } : i))
      }
      return [...cur, { product_id: productId, qty: Math.min(99, qty) }]
    })
  }, [])

  const setQty = useCallback((productId, qty) => {
    setItems((cur) =>
      qty <= 0
        ? cur.filter((i) => i.product_id !== productId)
        : cur.map((i) => (i.product_id === productId ? { ...i, qty: Math.min(99, qty) } : i)),
    )
  }, [])

  const remove = useCallback((productId) => {
    setItems((cur) => cur.filter((i) => i.product_id !== productId))
  }, [])

  const clear = useCallback(() => setItems([]), [])

  const value = useMemo(() => {
    const qtyById = new Map(items.map((i) => [i.product_id, i.qty])) // each product card looks itself up
    return {
      items,
      count: items.reduce((n, i) => n + i.qty, 0),
      qtyOf: (id) => qtyById.get(id) || 0,
      add,
      setQty,
      remove,
      clear,
    }
  }, [items, add, setQty, remove, clear])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export const useCart = () => useContext(CartContext)
