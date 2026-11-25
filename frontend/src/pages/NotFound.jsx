import { Link } from 'react-router-dom'
import { useTitle } from '../lib/useTitle'

export default function NotFound({ title = 'Page not found', text = "We couldn't find the page you were looking for." }) {
  useTitle(title)
  return (
    <div className="container page notfound">
      <span className="notfound-code" aria-hidden="true">404</span>
      <h1>{title}</h1>
      <p className="muted">{text}</p>
      <div className="hero-actions">
        <Link to="/shop" className="btn btn-primary">Browse the shop</Link>
        <Link to="/" className="btn btn-ghost">Go home</Link>
      </div>
    </div>
  )
}
