import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import ServerWakeNotice from './components/ServerWakeNotice'
import StoreLayout from './components/StoreLayout'
import { Loader } from './components/ui'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import Contact from './pages/Contact'
import Home from './pages/Home'
import NotFound from './pages/NotFound'
import OrderConfirmation from './pages/OrderConfirmation'
import ProductDetail from './pages/ProductDetail'
import Shop from './pages/Shop'

const AdminApp = lazy(() => import('./admin/AdminApp'))

export default function App() {
  return (
    <>
      <ServerWakeNotice />
      <Routes>
        <Route element={<StoreLayout />}>
          <Route index element={<Home />} />
          <Route path="shop" element={<Shop />} />
          <Route path="product/:id" element={<ProductDetail />} />
          <Route path="cart" element={<Cart />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="order/confirmation" element={<OrderConfirmation />} />
          <Route path="contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route
          path="admin/*"
          element={
            <Suspense fallback={<div className="admin-center"><Loader /></div>}>
              <AdminApp />
            </Suspense>
          }
        />
      </Routes>
    </>
  )
}
