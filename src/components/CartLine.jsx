import { useRef } from 'react';
import { Link } from 'react-router-dom';
import Icon from './Icon.jsx';
import { useThumb } from '../hooks/useProductImages.js';
import { formatPrice } from '../js/data.js';
import { setQty, removeItem } from '../js/cart.js';
import { gsap } from '../js/animations.js';
import { toast } from '../js/toast.js';

export function QtyControl({ value, onStep, large = false, id }) {
  return (
    <div className={`qty${large ? ' qty--lg' : ''}`}>
      <button type="button" aria-label="Decrease quantity" onClick={() => onStep(-1)}>
        <Icon name="minus" />
      </button>
      <span id={id} aria-live="polite">
        {value}
      </span>
      <button type="button" aria-label="Increase quantity" onClick={() => onStep(1)}>
        <Icon name="plus" />
      </button>
    </div>
  );
}

/** One product line in the cart drawer or on the cart page. */
export default function CartLine({ item, large = false }) {
  const p = item.product;
  const ref = useRef(null);
  const thumb = useThumb(p.id);
  const href = `/product/${p.id}`;

  const remove = () => {
    const done = () => {
      removeItem(p.id);
      toast(`${p.name} removed`, 'trash-2');
    };
    if (ref.current) gsap.to(ref.current, { opacity: 0, x: 30, duration: 0.25, onComplete: done });
    else done();
  };

  return (
    <article className={`line${large ? ' line--large' : ''}`} ref={ref}>
      <Link className="line__img" to={href}>
        <img src={thumb} alt={p.name} loading="lazy" />
      </Link>
      <div className="line__info">
        <Link className="line__name" to={href}>
          {p.name}
        </Link>
        <span className="line__meta">{p.categoryLabel}</span>
        <div className="line__row">
          <QtyControl value={item.qty} onStep={(d) => setQty(p.id, item.qty + d)} />
          <button className="line__remove" type="button" onClick={remove}>
            <Icon name="trash-2" />
            <span>Remove</span>
          </button>
        </div>
      </div>
      <span className="line__price">{formatPrice(item.line)}</span>
    </article>
  );
}
