// Route-level code splitting. Each page is its own chunk, loaded the first time it's needed.
// preloadPath() starts loading a page's chunk early (link hover/focus, the start of the page
// curtain, or app start) so navigation doesn't wait on the network.
import { lazy } from 'react';
import { SHOP_ENABLED, PHASE2_ENABLED } from './config/features.js';

function lazyPage(load) {
  let promise = null;
  const preload = () =>
    (promise ||= load().catch((err) => {
      promise = null; // let a later navigation retry after a network error
      throw err;
    }));
  const Page = lazy(preload);
  Page.preload = preload;
  return Page;
}

export const Home = lazyPage(() => import('./pages/Home.jsx'));
// Phase 4 shop pages: only built when SHOP_ENABLED (config/features.js); otherwise null and
// their code is left out of the bundle.
export const Shop = SHOP_ENABLED ? lazyPage(() => import('./pages/Shop.jsx')) : null;
export const Product = SHOP_ENABLED ? lazyPage(() => import('./pages/Product.jsx')) : null;
export const Cart = SHOP_ENABLED ? lazyPage(() => import('./pages/Cart.jsx')) : null;
export const Checkout = SHOP_ENABLED ? lazyPage(() => import('./pages/Checkout.jsx')) : null;
export const GajjuMini = lazyPage(() => import('./pages/GajjuMini.jsx'));
export const BuildLog = lazyPage(() => import('./pages/BuildLog.jsx'));
export const About = lazyPage(() => import('./pages/About.jsx'));
// Phase 2 pages: hidden for now, only built when PHASE2_ENABLED (config/features.js).
export const Schools = PHASE2_ENABLED ? lazyPage(() => import('./pages/Schools.jsx')) : null;
export const Parents = PHASE2_ENABLED ? lazyPage(() => import('./pages/Parents.jsx')) : null;
export const Founding = lazyPage(() => import('./pages/Founding.jsx'));
export const Privacy = lazyPage(() => import('./pages/Privacy.jsx'));
export const Terms = lazyPage(() => import('./pages/Terms.jsx'));

const PAGE_FOR = {
  '': Home,
  'index.html': Home,
  'gajju-mini': GajjuMini,
  'build-log': BuildLog,
  schools: Schools,
  parents: Parents,
  about: About,
  founding: Founding,
  privacy: Privacy,
  terms: Terms,
  shop: Shop,
  'shop.html': Shop,
  product: Product,
  'product.html': Product,
  cart: Cart,
  'cart.html': Cart,
  checkout: Checkout,
  'checkout.html': Checkout,
};

/** Starts loading the page chunk for a pathname. Resolves when it's ready (never rejects). */
export function preloadPath(pathname) {
  // Unknown paths, and the shop and Phase 2 paths while they are off, redirect home.
  const page = PAGE_FOR[pathname.split('/')[1] ?? ''] || Home;
  return page.preload().catch(() => {});
}
