// Store grid card: photo, type badge, name, one-line description, price, full-width Add to cart.
// Used on the home page and the shop page so products look the same everywhere.
// Styled with Tailwind utilities; the class strings live here so the markup stays readable.
import { formatPrice } from './data.js';
import { getProductImages } from './product-images.js';

/** Grid that holds the cards (home + shop). */
export const PRODUCT_GRID = 'grid grid-cols-[repeat(auto-fit,minmax(min(100%,280px),1fr))] gap-[clamp(1rem,2.5vw,1.75rem)]';

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

export function productCard(p, { headingTag = 'h2' } = {}) {
  const img = getProductImages(p.id)[0];
  const H = headingTag;
  const diy = p.category === 'diy';
  return `<article class="${CARD.root}" data-id="${p.id}">
    <a class="${CARD.media}" href="product.html?id=${p.id}" aria-label="${p.name}">
      ${img ? `<img class="${CARD.img}" src="${img.src}" alt="${img.alt}" loading="lazy" />` : ''}
    </a>
    <div class="${CARD.body}">
      <span class="${CARD.badge} ${diy ? CARD.badgeKit : CARD.badgeBuilt}">${diy ? 'DIY Kit' : 'Fully assembled'}</span>
      <${H} class="${CARD.name}"><a class="${CARD.nameLink}" href="product.html?id=${p.id}">${p.name}</a></${H}>
      <p class="${CARD.sub}">${p.subtitle || p.tagline}</p>
      <p class="${CARD.price}">${formatPrice(p.price)}${p.compareAt ? ` <s class="${CARD.was}">${formatPrice(p.compareAt)}</s>` : ''}</p>
      <button class="${CARD.cta}" data-add-to-cart="${p.id}">Add to cart</button>
    </div>
  </article>`;
}

/** Kept for callers; the grid card needs no extra behaviour. */
export function initProductCards() {}
