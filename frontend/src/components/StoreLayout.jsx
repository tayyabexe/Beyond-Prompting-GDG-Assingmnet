import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Footer from './Footer'
import Header from './Header'

export default function StoreLayout() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])

  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <Header />
      <main id="main" className="site-main" tabIndex={-1}>
        {/* key={pathname} replays the fade-in on every page change */}
        <div key={pathname} className="page-fade">
          <Outlet />
        </div>
      </main>
      <Footer />
    </>
  )
}
