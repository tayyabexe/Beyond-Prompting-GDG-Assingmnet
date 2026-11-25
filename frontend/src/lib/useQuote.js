import { api } from '../api/client'
import { useCart } from '../context/CartContext'
import { useAsync } from './useAsync'

// Re-prices the cart from the database whenever it changes.
export function useQuote() {
  const { items } = useCart()
  const key = JSON.stringify(items)
  return useAsync(
    () => (items.length ? api.quote(items) : Promise.resolve({ lines: [], subtotal: 0, shipping: 0, total: 0, has_issues: false })),
    [key],
  )
}
