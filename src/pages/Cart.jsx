import { useRef } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import SplitText from '../components/SplitText.jsx';
import CartLine from '../components/CartLine.jsx';
import OrderSummary from '../components/OrderSummary.jsx';
import { useCart } from '../hooks/useCart.js';
import { useThumb } from '../hooks/useProductImages.js';
import { useReveals } from '../hooks/useReveals.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { FREE_SHIPPING_THRESHOLD, clearCart } from '../js/cart.js';
import { formatPrice, PRODUCTS } from '../js/data.js';
import { toast } from '../js/toast.js';

function Suggestion({ product: p }) {
  const thumb = useThumb(p.id);
  return (
    <Link className="cart-suggest__item" to={`/product/${p.id}`}>
      <img src={thumb} alt="" />
      <span>
        <strong>{p.name}</strong>
        <span className="muted">{formatPrice(p.price)}</span>
      </span>
    </Link>
  );
}

export default function Cart() {
  useDocumentTitle('Cart · Gajju');
  const { items, totals: t } = useCart();
  const mainRef = useRef(null);
  useReveals(mainRef);
  const left = FREE_SHIPPING_THRESHOLD - t.subtotal;

  return (
    <main id="main" className="page" ref={mainRef}>
      <div className="wrap">
        <header className="mb-[clamp(2rem,4vw,3rem)] flex flex-wrap items-end justify-between gap-4">
          <SplitText as="h1" className="display display--md" text="YOUR CART." />
          <Link
            className="inline-flex items-center gap-[0.3rem] text-[0.92rem] text-muted hover:text-accent [&_svg]:size-4"
            to="/shop"
          >
            <Icon name="chevron-left" />
            Continue shopping
          </Link>
        </header>
        <div className="cart-page">
          {!items.length ? (
            <div className="empty empty--page">
              <div className="empty__icon">
                <Icon name="shopping-bag" />
              </div>
              <h2>Your cart is empty</h2>
              <p>Start with a robot that’s ready to run, or a kit you build yourself.</p>
              <div className="cart-suggest">
                {PRODUCTS.map((p) => (
                  <Suggestion key={p.id} product={p} />
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="cart-page__lines">
                <div className="cart-page__ship">
                  {left > 0
                    ? `Add ${formatPrice(left)} more to get free standard shipping.`
                    : 'You’ve unlocked free standard shipping.'}
                  <div className="meter">
                    <span style={{ width: `${Math.min(100, (t.subtotal / FREE_SHIPPING_THRESHOLD) * 100)}%` }} />
                  </div>
                </div>
                {items.map((i) => (
                  <CartLine key={i.id} item={i} large />
                ))}
                <button
                  className="text-link cart-page__clear"
                  onClick={() => {
                    clearCart();
                    toast('Cart cleared', 'trash-2');
                  }}
                >
                  <Icon name="trash-2" />
                  Clear cart
                </button>
              </div>
              <aside className="summary">
                <h2>Order summary</h2>
                <OrderSummary totals={t} />
              </aside>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
