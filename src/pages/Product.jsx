import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import Stars from '../components/Stars.jsx';
import SplitText from '../components/SplitText.jsx';
import ComponentIcon from '../components/ComponentIcon.jsx';
import { QtyControl } from '../components/CartLine.jsx';
import { useSite } from '../context/SiteContext.jsx';
import { useProductImages } from '../hooks/useProductImages.js';
import { useAddToCart } from '../hooks/useAddToCart.js';
import { useReveals } from '../hooks/useReveals.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { getProduct, PRODUCTS, REVIEWS, KIT_COMPONENTS, formatPrice } from '../js/data.js';
import { FREE_SHIPPING_THRESHOLD, addToCart } from '../js/cart.js';
import { createGajjuViewer } from '../js/gajju-viewer.js';
import { load, save } from '../js/storage.js';
import { toast } from '../js/toast.js';
import { gsap, reduced } from '../js/animations.js';

// Reviews saved by the old (non-React) site were HTML-escaped; React escapes on render instead.
const unescape = (s) => String(s).replace(/&lt;|&gt;|&amp;/g, (m) => ({ '&lt;': '<', '&gt;': '>', '&amp;': '&' })[m]);
// Visitor reviews are stored newest first; keys count from the oldest so they stay stable.
const savedReviews = (id) =>
  load(`reviews-${id}`, []).map((r, i, list) => ({
    ...r,
    key: `mine-${list.length - i}`,
    name: unescape(r.name),
    title: unescape(r.title),
    body: unescape(r.body),
  }));

function NotFound() {
  useDocumentTitle('Product not found · Gajju');
  return (
    <main id="main" className="page">
      <div className="wrap">
        <div className="empty notfound">
          <div className="empty__icon">
            <Icon name="search" />
          </div>
          <h1>We couldn’t find that product</h1>
          <p>The link may be out of date. Here’s everything we currently make.</p>
          <div className="empty__actions">
            {PRODUCTS.map((x) => (
              <Link key={x.id} className="btn btn--ghost" to={`/product/${x.id}`}>
                {x.name}
              </Link>
            ))}
            <Link className="btn btn--primary" to="/shop">
              Go to shop
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

/**
 * Store-style gallery: product photos first, with a "3D view" thumbnail at the end.
 * The 3D viewer is created only when that thumbnail is first opened.
 */
function Gallery({ product: p }) {
  const images = useProductImages(p.id);
  const [view, setView] = useState(images.length ? 0 : '3d');
  const [started, setStarted] = useState(view === '3d');
  const visualRef = useRef(null);
  const stageRef = useRef(null);
  const is3d = view === '3d';

  useEffect(() => {
    if (is3d) setStarted(true);
  }, [is3d]);

  useEffect(() => {
    if (!started) return;
    const viewer = createGajjuViewer(stageRef.current, { explode: 0, zoomOnEngage: true, zoom: true, ui: visualRef.current });
    return () => viewer?.destroy();
  }, [started]);

  const photo = !is3d ? images[Number(view)] : null;
  return (
    <div className={`pdp__visual studio${is3d ? '' : ' is-photo'}`} ref={visualRef}>
      <div
        className={`pdp__stage${started ? ' gstage' : ''}${is3d ? '' : ' is-dimmed'}`}
        data-cursor="drag"
        tabIndex={-1}
        ref={stageRef}
      />
      <figure className="prod__photo" hidden={is3d}>
        {photo && <img src={photo.src} alt={photo.alt} />}
      </figure>
      <p className="prod__hint">
        <Icon name="hand" />
        Drag to rotate, right-drag to pan, click then scroll to zoom. Click a part to inspect it.
      </p>
      <div className="prod__thumbs" role="tablist" aria-label="Product views">
        {images.map((im, i) => (
          <button
            key={i}
            type="button"
            className={`thumb${view === i ? ' is-active' : ''}`}
            role="tab"
            aria-selected={view === i}
            onClick={() => setView(i)}
          >
            <img src={im.src} alt={im.alt} />
          </button>
        ))}
        <button
          type="button"
          className={`thumb thumb--3d${is3d ? ' is-active' : ''}`}
          role="tab"
          aria-selected={is3d}
          onClick={() => setView('3d')}
        >
          <Icon name="move-3d" />
          <span>3D view</span>
        </button>
      </div>
    </div>
  );
}

function Price({ product: p }) {
  return (
    <div className="price">
      <span className="price__now">{formatPrice(p.price)}</span>
      {p.compareAt ? <s className="price__was">{formatPrice(p.compareAt)}</s> : null}
      <span className="price__note">{p.price >= FREE_SHIPPING_THRESHOLD ? 'Free shipping' : 'Ships in 2 days'}</span>
    </div>
  );
}

function BuyBox({ product: p }) {
  const [qty, setQty] = useState(1);
  const add = useAddToCart();
  const { go } = useSite();
  return (
    <div className="pdp__buy">
      <QtyControl large id="pdp-qty" value={qty} onStep={(d) => setQty((q) => Math.max(1, Math.min(10, q + d)))} />
      <button className="btn btn--primary btn--lg" onClick={() => add(p.id, qty)}>
        <Icon name="shopping-bag" />
        Add to cart
      </button>
      <button
        className="btn btn--ghost btn--lg"
        onClick={() => {
          addToCart(p.id, qty);
          setTimeout(() => go('/checkout'), 250);
        }}
      >
        <Icon name="zap" />
        Buy now
      </button>
    </div>
  );
}

function Review({ review: r, innerRef }) {
  return (
    <article className="review" ref={innerRef}>
      <header>
        <Stars rating={r.rating} />
        <strong>{r.title}</strong>
      </header>
      <p>{r.body}</p>
      <footer>
        <span>{r.name}</span>
        <span className="muted">{r.date}</span>
        {r.verified !== false && <span className="pill">Verified buyer</span>}
      </footer>
    </article>
  );
}

function Reviews({ product: p, kit }) {
  const [mine, setMine] = useState(() => savedReviews(p.id));
  const [msg, setMsg] = useState(null); // { text, ok }
  const newest = useRef(null);
  const justPosted = useRef(false);

  useLayoutEffect(() => {
    if (!justPosted.current || reduced || !newest.current) return;
    justPosted.current = false;
    gsap.from(newest.current, { opacity: 0, y: -20, duration: 0.5 });
  }, [mine]);

  const dist = [5, 4, 3, 2, 1].map((s) => ({
    s,
    pct: { 5: kit ? 82 : 76, 4: kit ? 14 : 18, 3: kit ? 3 : 4, 2: 1, 1: kit ? 0 : 1 }[s],
  }));

  const submit = (e) => {
    e.preventDefault();
    const f = e.currentTarget;
    const data = new FormData(f);
    const name = String(data.get('name') || '').trim();
    const title = String(data.get('title') || '').trim();
    const body = String(data.get('body') || '').trim();
    if (!name || !title || body.length < 10) {
      setMsg({ text: 'Add your name, a headline and at least a sentence about your experience.', ok: false });
      return;
    }
    const r = { name, title, body, rating: Number(data.get('rating')), date: 'Just now', verified: false };
    const saved = load(`reviews-${p.id}`, []);
    saved.unshift(r);
    save(`reviews-${p.id}`, saved);
    justPosted.current = true;
    setMine((list) => [{ ...r, key: `mine-${list.length + 1}` }, ...list]);
    f.reset();
    setMsg({ text: 'Review posted. Thanks for helping other builders.', ok: true });
    toast('Review posted', 'star');
  };

  const all = [...mine, ...REVIEWS[p.id].map((r, i) => ({ ...r, key: `review-${i}` }))];
  return (
    <section className="pdp-sec reviews" id="reviews">
      <div className="reviews__summary">
        <h2 className="pdp-h">Customer reviews</h2>
        <div className="reviews__score">
          <strong>{p.rating}</strong>
          <Stars rating={p.rating} />
          <span className="muted">{p.reviewCount} reviews</span>
        </div>
        <ul className="reviews__dist">
          {dist.map((d) => (
            <li key={d.s}>
              <span>{d.s}</span>
              <div className="meter">
                <span style={{ width: `${d.pct}%` }} />
              </div>
              <span className="muted">{d.pct}%</span>
            </li>
          ))}
        </ul>
        <form className="form review-form" noValidate onSubmit={submit}>
          <h3>Write a review</h3>
          <fieldset className="rate-input">
            <legend className="sr-only">Rating</legend>
            {[5, 4, 3, 2, 1].map((n) => (
              <Fragment key={n}>
                <input type="radio" name="rating" id={`r${n}`} value={n} defaultChecked={n === 5} />
                <label htmlFor={`r${n}`} aria-label={`${n} stars`}>
                  <Icon name="star" />
                </label>
              </Fragment>
            ))}
          </fieldset>
          <label className="field">
            <span>Name</span>
            <input name="name" required />
          </label>
          <label className="field">
            <span>Headline</span>
            <input name="title" required />
          </label>
          <label className="field">
            <span>Review</span>
            <textarea name="body" rows={3} required />
          </label>
          <p className={`form-msg${msg ? (msg.ok ? ' is-ok' : ' is-error') : ''}`}>{msg?.text}</p>
          <button className="btn btn--ghost" type="submit">
            Post review
          </button>
        </form>
      </div>
      <div className="reviews__list">
        {all.map((r, i) => (
          <Review key={r.key} review={r} innerRef={i === 0 ? newest : undefined} />
        ))}
      </div>
    </section>
  );
}

function Related({ product: other }) {
  const img = useProductImages(other.id, 1)[0];
  return (
    <section className="pdp-sec related">
      <h2 className="pdp-h">Also available</h2>
      <Link className="related__card" to={`/product/${other.id}`}>
        <img src={img?.src} alt={other.name} />
        <div>
          <span className="prod__tag">
            <b>{other.sku}</b>
            {other.categoryLabel}
          </span>
          <h3>{other.name}</h3>
          <p>{other.tagline}</p>
          <span className="price__now">{formatPrice(other.price)}</span>
        </div>
        <span className="related__go">
          <Icon name="arrow-up-right" />
        </span>
      </Link>
    </section>
  );
}

function ProductDetail({ product: p }) {
  useDocumentTitle(`${p.name} · Gajju`);
  const kit = p.category === 'diy'; // DIY parts kit vs fully assembled GAJJU
  const other = PRODUCTS.find((x) => x.id !== p.id);
  const shots = useProductImages(p.id).slice(1, 4);
  const [extraReviews] = useState(() => load(`reviews-${p.id}`, []).length);
  const mainRef = useRef(null);
  useReveals(mainRef);

  return (
    <main id="main" className="page" ref={mainRef}>
      <div className="wrap">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link to="/shop">Shop</Link>
          <Icon name="chevron-right" />
          <Link to={`/shop?cat=${p.category}`}>{p.categoryLabel}</Link>
          <Icon name="chevron-right" />
          <span aria-current="page">{p.name}</span>
        </nav>

        <section className="pdp pdp--kit">
          <Gallery product={p} />

          <div className="pdp__info">
            <span className="prod__tag">
              <b>{p.sku}</b>
              {p.categoryLabel}
            </span>
            <h1 className="pdp__name">{p.name}</h1>
            <a className="listing__rating" href="#reviews">
              <Stars rating={p.rating} />
              <span>
                {p.rating} from {p.reviewCount + extraReviews} reviews
              </span>
            </a>
            <Price product={p} />
            <p className="pdp__desc">{p.description}</p>
            <ul className="checks">
              {p.features.map((f) => (
                <li key={f}>
                  <Icon name="check" />
                  {f}
                </li>
              ))}
            </ul>
            {kit && (
              <div className="kit-meta kit-meta--pdp">
                <div className="kit-meta__item">
                  <span>Assembly difficulty</span>
                  <div className="difficulty" aria-label={`Difficulty ${p.difficulty} out of 5`}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <i key={i} className={i <= p.difficulty ? 'on' : ''} />
                    ))}
                  </div>
                  <strong>{p.difficultyLabel}</strong>
                </div>
                <div className="kit-meta__item">
                  <span>CAD parts</span>
                  <strong className="kit-meta__big">104</strong>
                </div>
              </div>
            )}
            <BuyBox product={p} />
            <ul className="assurances">
              <li>
                <Icon name="truck" />
                <span>Free standard shipping, 4–6 days</span>
              </li>
              <li>
                <Icon name="shield-check" />
                <span>{kit ? '1-year parts guarantee' : '2-year warranty'}, 30-day returns</span>
              </li>
            </ul>
          </div>
        </section>

        <nav className="pdp-tabs" aria-label="Product sections">
          <a href="#overview">Overview</a>
          <a href="#specs">Specifications</a>
          <a href="#components">Components</a>
          <a href="#reviews">Reviews</a>
        </nav>

        <section className="pdp-sec pdp-overview" id="overview">
          <SplitText
            className="display display--md"
            text={kit ? 'BUILD IT. UNDERSTAND IT.' : 'SWITCH IT ON. WATCH IT WALK.'}
          />
          <p className="pdp-overview__long" data-reveal>
            {p.long}
          </p>
          <div className="pdp-overview__shots">
            {shots.map((im) => (
              <figure key={im.alt} data-reveal>
                <img src={im.src} alt={im.alt} loading="lazy" />
              </figure>
            ))}
          </div>
        </section>

        <section className="pdp-sec pdp-specs" id="specs">
          <div>
            <h2 className="pdp-h">Specifications</h2>
            <dl className="spec-table">
              {p.specs.map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="pdp-specs__side">
            <h2 className="pdp-h">Technical details</h2>
            <dl className="spec-table">
              {p.technical.map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
            <h2 className="pdp-h">What’s included</h2>
            <ul className="included">
              {p.included.map((x) => (
                <li key={x}>
                  <Icon name="package" />
                  {x}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="pdp-sec" id="components">
          <h2 className="pdp-h">{kit ? 'Component breakdown' : 'What’s inside'}</h2>
          <p className="muted pdp-sub">
            {kit
              ? 'Every part in the tray, what it does, and how many you get.'
              : 'Every part inside your assembled GAJJU, and what it does.'}
          </p>
          <div className="breakdown">
            {KIT_COMPONENTS.map((c) => (
              <article key={c.id} className="bd" data-reveal>
                <ComponentIcon icon={c.icon} />
                <div>
                  <h3>{c.name}</h3>
                  <p>{c.desc}</p>
                </div>
                <dl>
                  <div>
                    <dt>Qty</dt>
                    <dd>{c.qty}</dd>
                  </div>
                  <div>
                    <dt>Spec</dt>
                    <dd>{c.spec}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        </section>

        <Reviews product={p} kit={kit} />

        {other && <Related product={other} />}
      </div>
    </main>
  );
}

export default function Product({ id }) {
  const p = getProduct(id);
  return p ? <ProductDetail product={p} /> : <NotFound />;
}
