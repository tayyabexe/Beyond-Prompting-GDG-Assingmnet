import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ErrorBox, Field, Loader } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { supabaseReady } from '../lib/supabase'
import { useTitle } from '../lib/useTitle'

export default function Login() {
  const { checking, isAdmin, signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  useTitle('Merchant login')

  if (checking) return <div className="admin-center"><Loader text="Checking your session…" /></div>
  if (isAdmin) return <Navigate to={location.state?.from || '/admin'} replace />

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    const found = {}
    if (!email.trim()) found.email = 'Email is required.'
    if (!password) found.password = 'Password is required.'
    setErrors(found)
    if (Object.keys(found).length) return
    setBusy(true)
    try {
      await signIn(email, password)
      navigate(location.state?.from || '/admin', { replace: true })
    } catch (err) {
      setError(err)
      setBusy(false)
    }
  }

  return (
    <div className="login-page">
      <form className="card login-card form" onSubmit={submit} noValidate>
        <Link to="/" className="logo"><span className="logo-mark" aria-hidden="true">N</span>NEXUS</Link>
        <h1>Merchant login</h1>
        <p className="muted">Sign in to manage orders, customers and inquiries.</p>
        {!supabaseReady && (
          <p className="alert alert-warn">Login isn't configured: add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to frontend/.env.</p>
        )}
        <Field id="login-email" label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} autoComplete="username" autoFocus />
        <Field id="login-password" label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} autoComplete="current-password" />
        <ErrorBox error={error} />
        <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
        <Link to="/" className="muted small login-back">← Back to the store</Link>
      </form>
    </div>
  )
}
