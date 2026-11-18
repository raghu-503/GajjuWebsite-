// Store grid card: photo, type badge, name, one-line description, price, full-width Add to cart.
// Used on the home page and the shop page so products look the same everywhere.
import { Link } from 'react-router-dom';
import { formatPrice } from '../js/data.js';
import { useProductImages } from '../hooks/useProductImages.js';
import { useAddToCart } from '../hooks/useAddToCart.js';

/** Grid that holds the cards (home + shop). */
export const PRODUCT_GRID =
  'grid grid-cols-[repeat(auto-fit,minmax(min(100%,280px),1fr))] gap-[clamp(1rem,2.5vw,1.75rem)]';

const CARD = {
  root: 'grid grid-rows-[auto_1fr] rounded-card',
  media: 'group block aspect-square overflow-hidden rounded-card border border-line bg-[#f3f5f8]',
  img: 'size-full object-cover transition-transform duration-400 ease-site group-hover:scale-[1.03]',
  body: 'grid content-start gap-[0.45rem] pt-[0.9rem]',
  badge: 'w-fit rounded-full px-[0.6rem] py-[0.15rem] text-[0.76rem] font-semibold',
  badgeBuilt: 'text-ok bg-[rgb(29_143_90/0.12)] dark:bg-[rgb(74_222_155/0.12)]',
  badgeKit: 'text-brand-blue bg-[rgb(var(--blue-rgb)/0.12)]',
  name: 'text-[1.15rem] font-bold',
  nameLink: 'hover:text-accent',
  sub: 'text-[0.92rem] text-muted',
  price: 'text-[1.15rem] font-bold',
  was: 'text-[0.9rem] font-medium text-muted',
  cta:
    'mt-[0.35rem] min-h-11 w-full rounded-lg bg-fg text-bg text-[0.86rem] font-bold uppercase tracking-[0.04em] ' +
    'transition-colors duration-200 hover:bg-accent hover:text-on-accent',
};

export default function ProductCard({ product: p, headingTag: H = 'h2' }) {
  const img = useProductImages(p.id, 1)[0];
  const add = useAddToCart();
  const diy = p.category === 'diy';
  const href = `/product/${p.id}`;
  return (
    <article className={CARD.root}>
      <Link className={CARD.media} to={href} aria-label={p.name}>
        {img && <img className={CARD.img} src={img.src} alt={img.alt} loading="lazy" />}
      </Link>
      <div className={CARD.body}>
        <span className={`${CARD.badge} ${diy ? CARD.badgeKit : CARD.badgeBuilt}`}>
          {diy ? 'DIY Kit' : 'Fully assembled'}
        </span>
        <H className={CARD.name}>
          <Link className={CARD.nameLink} to={href}>
            {p.name}
          </Link>
        </H>
        <p className={CARD.sub}>{p.subtitle || p.tagline}</p>
        <p className={CARD.price}>
          {formatPrice(p.price)}
          {p.compareAt ? (
            <>
              {' '}
              <s className={CARD.was}>{formatPrice(p.compareAt)}</s>
            </>
          ) : null}
        </p>
        <button className={CARD.cta} onClick={() => add(p.id)}>
          Add to cart
        </button>
      </div>
    </article>
  );
}
