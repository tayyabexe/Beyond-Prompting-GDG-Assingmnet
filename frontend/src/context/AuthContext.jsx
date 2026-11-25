// Admin login with Supabase Auth. After sign-in we call GET /admin/me so the backend
// confirms the email is on its ADMIN_EMAILS allowlist. Non-admins are signed out again.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { adminApi, ApiError } from '../api/client'
import { supabase, supabaseReady } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // The token lives in a ref: Supabase refreshes it about once an hour, and keeping it out of
  // state means a refresh doesn't create a new `api` object and reload every admin page.
  const tokenRef = useRef(null)
  const [signedIn, setSignedIn] = useState(false)
  const [email, setEmail] = useState(null)
  const [checking, setChecking] = useState(true)
  const api = useMemo(() => adminApi(() => tokenRef.current), [])

  const clear = useCallback(() => {
    tokenRef.current = null
    setSignedIn(false)
    setEmail(null)
  }, [])

  const verify = useCallback(
    async (s) => {
      if (!s) {
        clear()
        return
      }
      try {
        const me = await adminApi(s.access_token).me()
        tokenRef.current = s.access_token
        setSignedIn(true)
        setEmail(me.email)
      } catch (err) {
        clear()
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          await supabase.auth.signOut()
        }
        throw err
      }
    },
    [clear],
  )

  useEffect(() => {
    if (!supabaseReady) {
      setChecking(false)
      return undefined
    }
    supabase.auth.getSession().then(async ({ data }) => {
      try {
        await verify(data.session)
      } catch {
        /* stays logged out */
      }
      setChecking(false)
    })
    // Keep the token fresh (Supabase refreshes it automatically) and react to logout.
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === 'SIGNED_OUT') clear()
      else if (event === 'TOKEN_REFRESHED' && s) tokenRef.current = s.access_token
    })
    return () => sub.subscription.unsubscribe()
  }, [verify, clear])

  const signIn = useCallback(
    async (emailInput, password) => {
      if (!supabaseReady) throw new Error('Admin login is not configured (missing Supabase keys in frontend/.env).')
      const { data, error } = await supabase.auth.signInWithPassword({ email: emailInput.trim(), password })
      if (error) throw new Error(error.message === 'Invalid login credentials' ? 'Wrong email or password.' : error.message)
      await verify(data.session)
    },
    [verify],
  )

  const signOut = useCallback(async () => {
    if (supabaseReady) await supabase.auth.signOut()
    clear()
  }, [clear])

  const value = useMemo(
    () => ({
      checking,
      email,
      isAdmin: signedIn && Boolean(email),
      api: signedIn ? api : null,
      signIn,
      signOut,
    }),
    [checking, email, signedIn, api, signIn, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
