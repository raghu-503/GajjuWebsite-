import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import OrderSummary from '../components/OrderSummary.jsx';
import { useSite } from '../context/SiteContext.jsx';
import { useCart } from '../hooks/useCart.js';
import { useThumb } from '../hooks/useProductImages.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { clearCart, clearPromo, cartTotals, getCart, SHIPPING_METHODS, FREE_SHIPPING_THRESHOLD } from '../js/cart.js';
import { formatPrice, getProduct } from '../js/data.js';
import { load, save } from '../js/storage.js';
import { gsap, reduced, scrollToTarget } from '../js/animations.js';

const COUNTRIES = ['India', 'United States', 'United Kingdom', 'Germany', 'Netherlands', 'Singapore', 'Australia', 'Canada'];
const SAVED_FIELDS = ['email', 'phone', 'first', 'last', 'address', 'address2', 'city', 'postal', 'country'];

const RULES = {
  email: (x) => /^\S+@\S+\.\S+$/.test(x) || 'Enter an email address like name@example.com.',
  phone: (x) => x.replace(/\D/g, '').length >= 8 || 'Enter a phone number with at least 8 digits.',
  first: (x) => !!x.trim() || 'Enter your first name.',
  last: (x) => !!x.trim() || 'Enter your last name.',
  address: (x) => x.trim().length > 3 || 'Enter your street address.',
  city: (x) => !!x.trim() || 'Enter your city.',
  postal: (x) => /^[A-Za-z0-9 -]{3,10}$/.test(x.trim()) || 'Enter a valid postal code.',
  cardName: (x) => !!x.trim() || 'Enter the name shown on the card.',
  cardNumber: (x) => x.replace(/\s/g, '').length === 16 || 'Card numbers have 16 digits.',
  cardExp: (x) => {
    const m = /^(\d{2})\/(\d{2})$/.exec(x);
    if (!m || +m[1] < 1 || +m[1] > 12) return 'Use the format MM/YY.';
    const exp = new Date(2000 + +m[2], +m[1]);
    return exp > new Date() || 'This card has expired.';
  },
  cardCvc: (x) => /^\d{3,4}$/.test(x) || 'Enter the 3 or 4 digit code.',
  upi: (x) => /^[\w.-]+@[\w]+$/.test(x.trim()) || 'Enter a UPI ID like name@bank.',
};

function StepsBar({ active }) {
  const steps = ['Cart', 'Details and payment', 'Confirmation'];
  return (
    <ol className="co-steps" aria-label="Checkout progress">
      {steps.map((s, i) => (
        <li key={s} className={i < active ? 'is-done' : i === active ? 'is-active' : undefined}>
          <span>{i < active ? <Icon name="check" /> : i + 1}</span>
          {i === 0 && active > 0 && active < 2 ? <Link to="/cart">{s}</Link> : s}
        </li>
      ))}
    </ol>
  );
}

function Field({ name, label, full = false, error, ...input }) {
  return (
    <label className={`field${full ? ' field--full' : ''}${error ? ' is-invalid' : ''}`} data-field={name}>
      <span>{label}</span>
      <input name={name} aria-invalid={error ? 'true' : undefined} {...input} />
      <small className="field__err" aria-live="polite">
        {error || ''}
      </small>
    </label>
  );
}

function CoLine({ id, qty, name, meta, line }) {
  const thumb = useThumb(id);
  return (
    <li>
      <span className="co-lines__img">
        <img src={thumb} alt="" />
        <b>{qty}</b>
      </span>
      <span className="co-lines__name">
        {name}
        <small>{meta}</small>
      </span>
      <span>{formatPrice(line)}</span>
    </li>
  );
}

function EmptyCheckout() {
  return (
    <>
      <StepsBar active={1} />
      <div className="empty empty--page">
        <div className="empty__icon">
          <Icon name="shopping-bag" />
        </div>
        <h1>There’s nothing to check out yet</h1>
        <p>Add a robot or a kit to your cart, then come back here to place your order.</p>
        <div className="empty__actions">
          <Link className="btn btn--primary" to="/shop">
            Browse products
          </Link>
        </div>
      </div>
    </>
  );
}

function CheckoutForm() {
  const { lenis } = useSite();
  const navigate = useNavigate();
  const [method, setMethod] = useState('standard');
  const [pay, setPay] = useState('card');
  const [errors, setErrors] = useState({});
  const [placing, setPlacing] = useState(false);
  const placed = useRef(false);
  const timer = useRef(0);
  const { items, totals } = useCart(method);
  const [user] = useState(() => load('user', null));
  const [saved] = useState(() => load('checkout-info', {}));
  const v = (k) => saved[k] || '';

  useEffect(() => () => clearTimeout(timer.current), []);

  if (!items.length && !placed.current) return <EmptyCheckout />;
  const sub = cartTotals('standard').subtotal;

  const onInput = (e) => {
    const t = e.target;
    if (t.name === 'cardNumber')
      t.value = t.value
        .replace(/\D/g, '')
        .slice(0, 16)
        .replace(/(\d{4})(?=\d)/g, '$1 ');
    if (t.name === 'cardExp') {
      const d = t.value.replace(/\D/g, '').slice(0, 4);
      t.value = d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
    }
    if (t.name === 'cardCvc') t.value = t.value.replace(/\D/g, '').slice(0, 4);
    if (errors[t.name] && RULES[t.name]?.(t.value) === true) setErrors(({ [t.name]: _, ...rest }) => rest);
  };

  const submit = (e) => {
    e.preventDefault();
    if (placing) return;
    const form = e.currentTarget;
    const el = (n) => form.elements.namedItem(n);
    const names = ['email', 'phone', 'first', 'last', 'address', 'city', 'postal'];
    if (pay === 'card') names.push('cardName', 'cardNumber', 'cardExp', 'cardCvc');
    if (pay === 'upi') names.push('upi');
    const errs = {};
    let first = null;
    names.forEach((n) => {
      const res = RULES[n](el(n).value);
      if (res !== true) {
        errs[n] = res;
        first ||= el(n);
      }
    });
    setErrors(errs);
    if (first) {
      scrollToTarget(lenis, first.closest('.co-sec'));
      setTimeout(() => first.focus({ preventScroll: true }), 400);
      return;
    }
    setPlacing(true);

    if (el('save').checked) {
      const keep = {};
      SAVED_FIELDS.forEach((k) => (keep[k] = el(k).value));
      save('checkout-info', keep);
    }

    const t = cartTotals(method);
    const days = method === 'express' ? 2 : 6;
    const eta = new Date();
    let added = 0;
    while (added < days) {
      eta.setDate(eta.getDate() + 1);
      if (eta.getDay() % 6 !== 0) added++;
    }
    const val = (n) => el(n).value;
    const order = {
      number: `GJ-${Date.now().toString(36).toUpperCase().slice(-6)}${Math.floor(Math.random() * 90 + 10)}`,
      date: new Date().toISOString(),
      eta: eta.toISOString(),
      items: getCart().map((i) => ({ id: i.id, qty: i.qty, line: i.line })),
      totals: { subtotal: t.subtotal, discount: t.discount, shipping: t.shipping, total: t.total },
      total: t.total,
      method,
      pay,
      name: `${val('first')} ${val('last')}`.trim(),
      email: val('email'),
      address: [val('address'), val('address2'), val('city'), val('postal'), val('country')].filter(Boolean).join(', '),
    };
    const orders = load('orders', []);
    orders.push(order);
    save('orders', orders);

    timer.current = setTimeout(
      () => {
        placed.current = true; // keep the form up (not the empty state) while the cart clears
        navigate(`/checkout?order=${order.number}`, { replace: true });
        clearCart();
        clearPromo();
      },
      reduced ? 50 : 1200,
    );
  };

  return (
    <>
      <StepsBar active={1} />
      <div className="checkout">
        <form className="checkout__form" noValidate onSubmit={submit} onInput={onInput}>
          <section className="co-sec">
            <h2>
              <span className="co-num">1</span>Contact
            </h2>
            <div className="form-grid">
              <Field name="email" label="Email" type="email" autoComplete="email" required defaultValue={v('email') || user?.email || ''} error={errors.email} />
              <Field name="phone" label="Phone" type="tel" autoComplete="tel" required defaultValue={v('phone')} placeholder="+91 98765 43210" error={errors.phone} />
            </div>
          </section>

          <section className="co-sec">
            <h2>
              <span className="co-num">2</span>Shipping address
            </h2>
            <div className="form-grid">
              <Field name="first" label="First name" autoComplete="given-name" required defaultValue={v('first') || user?.name?.split(' ')[0] || ''} error={errors.first} />
              <Field name="last" label="Last name" autoComplete="family-name" required defaultValue={v('last') || user?.name?.split(' ').slice(1).join(' ') || ''} error={errors.last} />
              <Field name="address" label="Street address" autoComplete="address-line1" required defaultValue={v('address')} full error={errors.address} />
              <Field name="address2" label="Apartment, suite (optional)" autoComplete="address-line2" defaultValue={v('address2')} full />
              <Field name="city" label="City" autoComplete="address-level2" required defaultValue={v('city')} error={errors.city} />
              <Field name="postal" label="Postal code" autoComplete="postal-code" required defaultValue={v('postal')} error={errors.postal} />
              <label className="field field--full" data-field="country">
                <span>Country</span>
                <select name="country" autoComplete="country-name" required defaultValue={v('country') || 'India'}>
                  {COUNTRIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
                <small className="field__err" />
              </label>
            </div>
          </section>

          <section className="co-sec">
            <h2>
              <span className="co-num">3</span>Shipping method
            </h2>
            <div className="radio-cards" role="radiogroup" aria-label="Shipping method">
              {Object.values(SHIPPING_METHODS).map((m) => (
                <label key={m.id} className="radio-card">
                  <input type="radio" name="ship" value={m.id} checked={method === m.id} onChange={() => setMethod(m.id)} />
                  <span className="radio-card__body">
                    <Icon name={m.id === 'express' ? 'zap' : 'truck'} />
                    <span>
                      <strong>{m.label}</strong>
                      <small>{m.eta}</small>
                    </span>
                    <b>{m.id === 'standard' && sub >= FREE_SHIPPING_THRESHOLD ? 'Free' : formatPrice(m.price)}</b>
                  </span>
                </label>
              ))}
            </div>
          </section>

          <section className="co-sec">
            <h2>
              <span className="co-num">4</span>Payment
            </h2>
            <p className="co-note">
              <Icon name="lock" />
              This is a demo checkout. No real payment is taken and nothing is sent anywhere.
            </p>
            <div className="pay-tabs" role="radiogroup" aria-label="Payment method">
              {[
                ['card', 'credit-card', 'Card'],
                ['upi', 'smartphone', 'UPI'],
                ['bank', 'landmark', 'Bank transfer'],
              ].map(([id, icon, label]) => (
                <label key={id} className="pay-tab">
                  <input type="radio" name="pay" value={id} checked={pay === id} onChange={() => setPay(id)} />
                  <span>
                    <Icon name={icon} />
                    {label}
                  </span>
                </label>
              ))}
            </div>
            <div className="pay-panel" hidden={pay !== 'card'}>
              <div className="form-grid">
                <Field name="cardName" label="Name on card" autoComplete="cc-name" full error={errors.cardName} />
                <Field name="cardNumber" label="Card number" inputMode="numeric" autoComplete="cc-number" placeholder="4242 4242 4242 4242" maxLength={19} full error={errors.cardNumber} />
                <Field name="cardExp" label="Expiry (MM/YY)" inputMode="numeric" autoComplete="cc-exp" placeholder="12/29" maxLength={5} error={errors.cardExp} />
                <Field name="cardCvc" label="Security code" inputMode="numeric" autoComplete="cc-csc" placeholder="123" maxLength={4} error={errors.cardCvc} />
              </div>
              <p className="muted co-hint">Use the test number 4242 4242 4242 4242 with any future date.</p>
            </div>
            <div className="pay-panel" hidden={pay !== 'upi'}>
              <div className="form-grid">
                <Field name="upi" label="UPI ID" placeholder="name@bank" full error={errors.upi} />
              </div>
              <p className="muted co-hint">
                You’d normally approve the request in your UPI app. In this demo, any ID in the form name@bank works.
              </p>
            </div>
            <div className="pay-panel" hidden={pay !== 'bank'}>
              <p className="muted co-hint">
                We’ll show bank details on the confirmation screen. Your order ships once the transfer clears, usually
                within one working day.
              </p>
            </div>
          </section>

          <label className="check-line">
            <input type="checkbox" name="save" defaultChecked /> Save these details in this browser for next time
          </label>
          <button
            className={`btn btn--primary btn--lg btn--block co-place${placing ? ' is-loading' : ''}`}
            type="submit"
            disabled={placing}
          >
            <Icon name="lock" />
            <span>{placing ? 'Placing order…' : 'Place order'}</span>
          </button>
        </form>

        <aside className="summary summary--sticky">
          <h2>Order summary</h2>
          <ul className="co-lines">
            {items.map((i) => (
              <CoLine key={i.id} id={i.id} qty={i.qty} name={i.product.name} meta={i.product.categoryLabel} line={i.line} />
            ))}
          </ul>
          <OrderSummary totals={totals} cta={false} />
        </aside>
      </div>
    </>
  );
}

const fmtDate = (d) => new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
const PAY_LABEL = { card: 'Card (demo)', upi: 'UPI (demo)', bank: 'Bank transfer (demo)' };

function Success({ order }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    if (reduced) return;
    const ctx = gsap.context(() => {
      gsap.fromTo('.success__ring', { strokeDashoffset: 340 }, { strokeDashoffset: 0, duration: 0.9, ease: 'power3.out' });
      gsap.fromTo('.success__tick', { strokeDashoffset: 80 }, { strokeDashoffset: 0, duration: 0.6, delay: 0.5, ease: 'power3.out' });
      gsap.from('.success > *:not(.success__mark)', { opacity: 0, y: 30, stagger: 0.1, duration: 0.8, delay: 0.3, ease: 'power3.out' });
    }, ref);
    return () => ctx.revert();
  }, [order.number]);

  return (
    <>
      <StepsBar active={2} />
      <section className="success" ref={ref}>
        <div className="success__mark" aria-hidden="true">
          <svg viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" className="success__ring" />
            <path d="M38 62l15 15 30-34" className="success__tick" />
          </svg>
        </div>
        <h1 className="display display--md">ORDER CONFIRMED.</h1>
        <p className="success__lead">
          Thanks, {order.name.split(' ')[0]}. A confirmation is on its way to <strong>{order.email}</strong>.
        </p>
        <div className="success__grid">
          <div className="success__card">
            <dl className="success__meta">
              <div>
                <dt>Order number</dt>
                <dd className="success__num">{order.number}</dd>
              </div>
              <div>
                <dt>Placed</dt>
                <dd>{fmtDate(order.date)}</dd>
              </div>
              <div>
                <dt>Shipping to</dt>
                <dd>{order.address}</dd>
              </div>
              <div>
                <dt>Payment</dt>
                <dd>{PAY_LABEL[order.pay]}</dd>
              </div>
            </dl>
            <ul className="co-lines">
              {order.items.map((i) => {
                const p = getProduct(i.id);
                return p ? (
                  <CoLine key={i.id} id={i.id} qty={i.qty} name={p.name} meta={p.categoryLabel} line={i.line} />
                ) : null;
              })}
            </ul>
            <dl className="totals">
              <div>
                <dt>Subtotal</dt>
                <dd>{formatPrice(order.totals.subtotal)}</dd>
              </div>
              {order.totals.discount ? (
                <div>
                  <dt>Discount</dt>
                  <dd>−{formatPrice(order.totals.discount)}</dd>
                </div>
              ) : null}
              <div>
                <dt>Shipping</dt>
                <dd>{order.totals.shipping ? formatPrice(order.totals.shipping) : 'Free'}</dd>
              </div>
              <div className="totals__grand">
                <dt>Total paid</dt>
                <dd>{formatPrice(order.total)}</dd>
              </div>
            </dl>
          </div>
          <div className="success__card">
            <h2>Delivery status</h2>
            <ol className="track">
              <li className="is-done">
                <span />
                <div>
                  <strong>Order placed</strong>
                  <small>{fmtDate(order.date)}</small>
                </div>
              </li>
              <li className="is-active">
                <span />
                <div>
                  <strong>{order.pay === 'bank' ? 'Waiting for transfer' : 'Preparing your order'}</strong>
                  <small>Final test and packing</small>
                </div>
              </li>
              <li>
                <span />
                <div>
                  <strong>Shipped</strong>
                  <small>Tracking link by email</small>
                </div>
              </li>
              <li>
                <span />
                <div>
                  <strong>Delivered</strong>
                  <small>Estimated {fmtDate(order.eta)}</small>
                </div>
              </li>
            </ol>
            {order.pay === 'bank' && (
              <p className="co-note">
                <Icon name="landmark" />
                Demo bank details: Gajju Ltd, account 0000 1111 2222, reference {order.number}.
              </p>
            )}
            <div className="success__actions">
              <Link className="btn btn--primary" to="/shop">
                Continue shopping
              </Link>
              <Link className="btn btn--ghost" to="/#learn">
                Start a lesson
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default function Checkout() {
  useDocumentTitle('Checkout · Gajju');
  const [params] = useSearchParams();
  const orderNo = params.get('order');
  const order = orderNo ? load('orders', []).find((o) => o.number === orderNo) : null;
  return (
    <main id="main" className="page">
      <div className="wrap">{order ? <Success key={order.number} order={order} /> : <CheckoutForm />}</div>
    </main>
  );
}
