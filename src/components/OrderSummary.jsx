// Totals + promo code form, shared by the cart page and checkout.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from './Icon.jsx';
import { formatPrice } from '../js/data.js';
import { applyPromo, clearPromo } from '../js/cart.js';
import { toast } from '../js/toast.js';

function PromoForm({ promo }) {
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState(null);
  const submit = (e) => {
    e.preventDefault();
    if (applyPromo(code)) {
      toast('Promo code applied', 'check');
      setCode('');
      setMsg(null);
    } else setMsg(`“${code || 'That code'}” isn’t a valid code. Try NEX10.`);
  };
  return (
    <form className="promo" noValidate onSubmit={submit}>
      {promo ? (
        <p className="promo__on">
          <Icon name="check" />
          {promo.label}
          <button type="button" className="text-link" onClick={clearPromo}>
            Remove
          </button>
        </p>
      ) : (
        <>
          <label className="sr-only" htmlFor="promo">
            Promo code
          </label>
          <div className="field-inline">
            <input
              id="promo"
              placeholder="Promo code, try NEX10"
              autoComplete="off"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <button className="btn btn--ghost btn--sm" type="submit">
              Apply
            </button>
          </div>
          <p className={`form-msg${msg ? ' is-error' : ''}`}>{msg}</p>
        </>
      )}
    </form>
  );
}

export default function OrderSummary({ totals: t, cta = true }) {
  return (
    <>
      <dl className="totals">
        <div>
          <dt>
            Subtotal ({t.count} {t.count === 1 ? 'item' : 'items'})
          </dt>
          <dd>{formatPrice(t.subtotal)}</dd>
        </div>
        {t.discount > 0 && (
          <div className="totals__disc">
            <dt>
              Discount <span className="pill">{t.promo.code}</span>
            </dt>
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
      <PromoForm promo={t.promo} />
      {cta && (
        <Link className="btn btn--primary btn--lg btn--block" to="/checkout">
          <Icon name="lock" />
          Checkout
        </Link>
      )}
      <p className="summary__note">
        <Icon name="shield-check" />
        Demo store. No payment is taken.
      </p>
    </>
  );
}
