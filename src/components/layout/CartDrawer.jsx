import { Link } from 'react-router-dom';
import Icon from '../Icon.jsx';
import CartLine from '../CartLine.jsx';
import { useSite } from '../../context/SiteContext.jsx';
import { useCart } from '../../hooks/useCart.js';
import { FREE_SHIPPING_THRESHOLD } from '../../js/cart.js';
import { formatPrice } from '../../js/data.js';

export function ShipProgress({ subtotal }) {
  if (subtotal <= 0) return null;
  const left = FREE_SHIPPING_THRESHOLD - subtotal;
  const pct = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);
  return (
    <>
      <p>{left > 0 ? `Add ${formatPrice(left)} more for free standard shipping` : 'Free standard shipping unlocked'}</p>
      <div className="meter">
        <span style={{ width: `${pct}%` }} />
      </div>
    </>
  );
}

export default function CartDrawer() {
  const { panel, closePanels } = useSite();
  const { items, totals: t } = useCart();
  const open = panel === 'cart';
  const close = () => closePanels(true);

  return (
    <aside className={`drawer${open ? ' is-open' : ''}`} data-panel="cart" aria-label="Shopping cart" aria-hidden={!open}>
      <div className="drawer__head">
        <h2>
          Your cart <span className="drawer__count">{t.count ? `(${t.count})` : ''}</span>
        </h2>
        <button className="icon-btn" data-close aria-label="Close cart" onClick={() => closePanels()}>
          <Icon name="x" />
        </button>
      </div>
      <div className="drawer__ship">
        <ShipProgress subtotal={t.subtotal} />
      </div>
      <div className="drawer__body">
        {items.length ? (
          items.map((i) => <CartLine key={i.id} item={i} />)
        ) : (
          <div className="empty">
            <div className="empty__icon">
              <Icon name="package" />
            </div>
            <h3>Your cart is empty</h3>
            <p>Pick a ready-to-run robot or a kit to build yourself.</p>
            <div className="empty__actions">
              <Link className="btn btn--primary btn--sm" to="/shop" onClick={close}>
                Shop GAJJU
              </Link>
            </div>
          </div>
        )}
      </div>
      <div className="drawer__foot">
        {items.length > 0 && (
          <>
            <dl className="totals">
              <div>
                <dt>Subtotal</dt>
                <dd>{formatPrice(t.subtotal)}</dd>
              </div>
              {t.discount > 0 && (
                <div>
                  <dt>Discount ({t.promo.code})</dt>
                  <dd>−{formatPrice(t.discount)}</dd>
                </div>
              )}
              <div>
                <dt>Shipping</dt>
                <dd>{t.shipping === 0 ? 'Free' : formatPrice(t.shipping)}</dd>
              </div>
              <div className="totals__grand">
                <dt>Total</dt>
                <dd>{formatPrice(t.total)}</dd>
              </div>
            </dl>
            <div className="drawer__cta">
              <Link className="btn btn--ghost" to="/cart" onClick={close}>
                View cart
              </Link>
              <Link className="btn btn--primary" to="/checkout" onClick={close}>
                <Icon name="lock" />
                Checkout
              </Link>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
