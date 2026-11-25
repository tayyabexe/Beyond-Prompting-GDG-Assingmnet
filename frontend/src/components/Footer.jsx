import { Link } from 'react-router-dom'
import { Logo } from './Header'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <Logo />
          <p className="muted">Everyday tech and workspace gear, delivered across Pakistan.</p>
        </div>
        <div>
          <h4>Shop</h4>
          <Link to="/shop?category=Audio">Audio</Link>
          <Link to="/shop?category=Wearables">Wearables</Link>
          <Link to="/shop?category=Home%20Office">Home Office</Link>
          <Link to="/shop?category=Accessories">Accessories</Link>
        </div>
        <div>
          <h4>Help</h4>
          <Link to="/contact">Contact us</Link>
          <Link to="/cart">Your cart</Link>
          <Link to="/admin">Merchant login</Link>
        </div>
        <div>
          <h4>Good to know</h4>
          <p className="muted small">Free shipping on orders of Rs 10,000 or more. Cash on Delivery available.</p>
          <p className="muted small">Product photos are openly licensed (CC0 / CC BY) — credits on each product page.</p>
        </div>
      </div>
      <div className="container footer-bottom muted small">
        © {new Date().getFullYear()} NEXUS Commerce — a student capstone demo. No real payments are taken.
      </div>
    </footer>
  )
}
