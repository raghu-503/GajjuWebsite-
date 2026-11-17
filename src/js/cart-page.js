import { initSite } from './main.js';
import { getCart, cartTotals, onCartChange, FREE_SHIPPING_THRESHOLD, clearCart } from './cart.js';
import { summaryMarkup, bindPromo } from './summary.js';
import { lineMarkup } from './cart-ui.js';
import { formatPrice, PRODUCTS } from './data.js';
import { getThumb } from './product-images.js';
import { refreshIcons } from './icons.js';
import { toast } from './toast.js';

const site = initSite('cart');
const root = document.querySelector('[data-cart-page]');

function render() {
  const cart = getCart();
  const t = cartTotals();
  if (!cart.length) {
    root.innerHTML = `<div class="empty empty--page">
      <div class="empty__icon"><i data-lucide="shopping-bag"></i></div>
      <h2>Your cart is empty</h2>
      <p>Start with a robot that’s ready to run, or a kit you build yourself.</p>
      <div class="cart-suggest">${PRODUCTS.map(
        (p) => `<a class="cart-suggest__item" href="product.html?id=${p.id}"><img src="${getThumb(p.id)}" alt="" /><span><strong>${p.name}</strong><span class="muted">${formatPrice(p.price)}</span></span></a>`
      ).join('')}</div>
    </div>`;
    refreshIcons();
    return;
  }
  const left = FREE_SHIPPING_THRESHOLD - t.subtotal;
  root.innerHTML = `
    <div class="cart-page__lines">
      <div class="cart-page__ship">${left > 0 ? `Add ${formatPrice(left)} more to get free standard shipping.` : 'You’ve unlocked free standard shipping.'}<div class="meter"><span style="width:${Math.min(100, (t.subtotal / FREE_SHIPPING_THRESHOLD) * 100)}%"></span></div></div>
      ${cart.map((i) => lineMarkup(i, { large: true })).join('')}
      <button class="text-link cart-page__clear" data-clear-cart><i data-lucide="trash-2"></i>Clear cart</button>
    </div>
    <aside class="summary">
      <h2>Order summary</h2>
      ${summaryMarkup(t)}
    </aside>`;
  refreshIcons();
}

root.addEventListener('click', (e) => {
  if (e.target.closest('[data-clear-cart]')) {
    clearCart();
    toast('Cart cleared', 'trash-2');
  }
});
bindPromo(root);
render();
onCartChange(render);
site.hydrate();
