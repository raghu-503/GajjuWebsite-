import { load, save, storageKey } from './storage.js';
import { getProduct } from './data.js';

const KEY = 'cart';
export const FREE_SHIPPING_THRESHOLD = 10000; // INR
export const SHIPPING_METHODS = {
  standard: { id: 'standard', label: 'Standard', eta: '4–6 business days', price: 199 },
  express: { id: 'express', label: 'Express', eta: '1–2 business days', price: 499 },
};

let items = sanitize(load(KEY, []));

function sanitize(list) {
  if (!Array.isArray(list)) return [];
  return list
    .filter((i) => i && getProduct(i.id))
    .map((i) => ({ id: i.id, qty: Math.max(1, Math.min(10, Number(i.qty) || 1)) }));
}

function commit() {
  save(KEY, items);
  window.dispatchEvent(new CustomEvent('cart:change', { detail: getCart() }));
}

export function getCart() {
  return items.map((i) => ({ ...i, product: getProduct(i.id), line: getProduct(i.id).price * i.qty }));
}

export const cartCount = () => items.reduce((n, i) => n + i.qty, 0);

export function addToCart(id, qty = 1) {
  if (!getProduct(id)) return;
  const existing = items.find((i) => i.id === id);
  if (existing) existing.qty = Math.min(10, existing.qty + qty);
  else items.push({ id, qty: Math.min(10, qty) });
  commit();
  window.dispatchEvent(new CustomEvent('cart:added', { detail: { id, qty } }));
}

export function setQty(id, qty) {
  const item = items.find((i) => i.id === id);
  if (!item) return;
  if (qty < 1) return removeItem(id);
  item.qty = Math.min(10, qty);
  commit();
}

export function removeItem(id) {
  items = items.filter((i) => i.id !== id);
  commit();
}

export function clearCart() {
  items = [];
  commit();
}

export const PROMOS = { NEX10: { rate: 0.1, label: '10% off your order' }, BUILDER: { rate: 0.15, label: '15% off for classrooms' } };

export function getPromo() {
  const code = load('promo', null);
  return code && PROMOS[code] ? { code, ...PROMOS[code] } : null;
}

export function applyPromo(code) {
  const c = String(code || '').trim().toUpperCase();
  if (!PROMOS[c]) return false;
  save('promo', c);
  window.dispatchEvent(new CustomEvent('cart:change', { detail: getCart() }));
  return true;
}

export function clearPromo() {
  save('promo', null);
  window.dispatchEvent(new CustomEvent('cart:change', { detail: getCart() }));
}

export function cartTotals(method = 'standard') {
  const subtotal = items.reduce((s, i) => s + getProduct(i.id).price * i.qty, 0);
  const promo = getPromo();
  const discount = promo ? Math.round(subtotal * promo.rate * 100) / 100 : 0;
  let shipping = 0;
  if (subtotal > 0) {
    const m = SHIPPING_METHODS[method] || SHIPPING_METHODS.standard;
    shipping = method === 'standard' && subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : m.price;
  }
  return { subtotal, discount, promo, shipping, total: subtotal - discount + shipping, count: cartCount() };
}

export function onCartChange(cb) {
  window.addEventListener('cart:change', () => cb(getCart()));
}

// Keep tabs in sync.
window.addEventListener('storage', (e) => {
  if (e.key === storageKey(KEY)) {
    items = sanitize(load(KEY, []));
    window.dispatchEvent(new CustomEvent('cart:change', { detail: getCart() }));
  }
});
