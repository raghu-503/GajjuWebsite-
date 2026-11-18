import { useEffect, useState } from 'react';
import Icon from '../Icon.jsx';
import { useSite } from '../../context/SiteContext.jsx';
import { load, save, remove } from '../../js/storage.js';
import { formatPrice } from '../../js/data.js';
import { toast } from '../../js/toast.js';

function SignInForm({ onSignIn }) {
  const [msg, setMsg] = useState(null);
  const submit = (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const name = String(f.get('name') || '').trim();
    const email = String(f.get('email') || '').trim();
    if (!name || !/^\S+@\S+\.\S+$/.test(email)) {
      setMsg('Enter your name and a valid email address.');
      return;
    }
    onSignIn({ name, email });
  };
  return (
    <form className="form account-form" noValidate onSubmit={submit}>
      <p className="muted">
        Sign in to see your orders and save checkout details. This is a demo, so nothing leaves your browser.
      </p>
      <label className="field">
        <span>Name</span>
        <input name="name" autoComplete="name" required />
      </label>
      <label className="field">
        <span>Email</span>
        <input name="email" type="email" autoComplete="email" required />
      </label>
      <p className={`form-msg${msg ? ' is-error' : ''}`}>{msg}</p>
      <button className="btn btn--primary btn--block" type="submit">
        Sign in
      </button>
    </form>
  );
}

export default function AccountPanel() {
  const { panel, closePanels } = useSite();
  const open = panel === 'account';
  const [user, setUser] = useState(() => load('user', null));
  const [orders, setOrders] = useState(() => load('orders', []));

  // Orders may have been placed since the panel last opened.
  useEffect(() => {
    if (!open) return;
    setUser(load('user', null));
    setOrders(load('orders', []));
  }, [open]);

  const signIn = (u) => {
    save('user', u);
    setUser(u);
    toast(`Signed in as ${u.name}`, 'user');
  };
  const signOut = () => {
    remove('user');
    setUser(null);
    toast('Signed out', 'log-out');
  };

  return (
    <aside className={`drawer drawer--account${open ? ' is-open' : ''}`} data-panel="account" aria-label="Account" aria-hidden={!open}>
      <div className="drawer__head">
        <h2>Account</h2>
        <button className="icon-btn" data-close aria-label="Close account" onClick={() => closePanels()}>
          <Icon name="x" />
        </button>
      </div>
      <div className="drawer__body">
        {!user ? (
          <SignInForm onSignIn={signIn} />
        ) : (
          <div className="account">
            <div className="account__who">
              <span className="avatar">{user.name.charAt(0).toUpperCase()}</span>
              <div>
                <strong>{user.name}</strong>
                <span className="muted">{user.email}</span>
              </div>
            </div>
            <h3>Recent orders</h3>
            {orders.length ? (
              <ul className="account__orders">
                {orders
                  .slice(-5)
                  .reverse()
                  .map((o) => (
                    <li key={o.number}>
                      <span>{o.number}</span>
                      <span className="muted">{new Date(o.date).toLocaleDateString()}</span>
                      <strong>{formatPrice(o.total)}</strong>
                    </li>
                  ))}
              </ul>
            ) : (
              <p className="muted">No orders yet. Your demo orders will appear here.</p>
            )}
            <button className="btn btn--ghost btn--block" onClick={signOut}>
              <Icon name="log-out" />
              Sign out
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
