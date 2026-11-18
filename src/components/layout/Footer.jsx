import { useState } from 'react';
import { Link } from 'react-router-dom';
import Logo from '../Logo.jsx';
import { save } from '../../js/storage.js';

function Newsletter() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState(null); // { text, ok }
  const submit = (e) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setMsg({ text: 'Enter a valid email address, like name@example.com.', ok: false });
      return;
    }
    save('newsletter', email.trim());
    setMsg({ text: 'Subscribed. The next build note arrives on the first of the month.', ok: true });
    setEmail('');
  };
  return (
    <form className="footer__news" noValidate onSubmit={submit}>
      <label htmlFor="news-email">Build notes, once a month</label>
      <div className="field-inline">
        <input
          id="news-email"
          type="email"
          placeholder="you@example.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button className="btn btn--primary btn--sm" type="submit">
          Subscribe
        </button>
      </div>
      <p className={`form-msg${msg ? (msg.ok ? ' is-ok' : ' is-error') : ''}`}>{msg?.text}</p>
    </form>
  );
}

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__top">
        <div className="footer__brand">
          <Link className="nav__brand" to="/">
            <Logo />
            <span className="nav__wordmark">Gajju</span>
          </Link>
          <p>Robots you can own, open up and understand. Designed in Hyderabad and Eindhoven.</p>
        </div>
        <div className="footer__cols">
          <div>
            <h3>Shop</h3>
            <Link to="/product/GAJJU">GAJJU Fully Assembled</Link>
            <Link to="/product/GAJJU-kit">GAJJU DIY Parts Kit</Link>
            <Link to="/shop">Shop</Link>
          </div>
          <div>
            <h3>Learn</h3>
            <Link to="/#learn">Lessons</Link>
            <Link to="/#assembly">Assembly guide</Link>
            <Link to="/#explore">3D explorer</Link>
          </div>
          <div>
            <h3>Company</h3>
            <Link to="/#about">About</Link>
            <Link to="/#contact">Contact</Link>
            <Link to="/cart">Cart</Link>
          </div>
        </div>
        <Newsletter />
      </div>
      <div className="footer__bottom">
        <span>© 2026 Gajju. Prototype storefront, no real orders are placed.</span>
        <a href="#main">Back to top</a>
      </div>
    </footer>
  );
}
