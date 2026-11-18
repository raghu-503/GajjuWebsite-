import { useSyncExternalStore } from 'react';
import { getCart, cartTotals } from '../js/cart.js';

// cart.js fires `cart:change` on every update (and on changes from other tabs).
let version = 0;
const subscribe = (cb) => {
  const handler = () => {
    version++;
    cb();
  };
  window.addEventListener('cart:change', handler);
  return () => window.removeEventListener('cart:change', handler);
};
const getVersion = () => version;

/** Re-renders whenever the cart or promo code changes. */
export function useCart(method = 'standard') {
  useSyncExternalStore(subscribe, getVersion);
  return { items: getCart(), totals: cartTotals(method) };
}
