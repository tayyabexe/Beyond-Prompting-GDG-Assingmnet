// Everything under /admin, loaded only when a merchant opens it.
// This keeps supabase-js out of the storefront bundle, so shoppers download less.
import { Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import NotFound from '../pages/NotFound'
import AdminLayout from './AdminLayout'
import Customers from './Customers'
import Dashboard from './Dashboard'
import Inquiries from './Inquiries'
import Login from './Login'
import Orders from './Orders'

export default function AdminApp() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="login" element={<Login />} />
        <Route element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="orders" element={<Orders />} />
          <Route path="customers" element={<Customers />} />
          <Route path="inquiries" element={<Inquiries />} />
          <Route path="*" element={<NotFound title="Admin page not found" text="Use the menu to find what you need." />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}
