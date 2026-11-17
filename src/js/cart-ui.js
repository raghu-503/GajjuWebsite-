import gsap from "gsap";
import {
  getCart,
  cartTotals,
  addToCart,
  setQty,
  removeItem,
  onCartChange,
  FREE_SHIPPING_THRESHOLD,
} from "./cart.js";
import { formatPrice, getProduct } from "./data.js";
import { getThumb } from "./product-images.js";
import { refreshIcons } from "./icons.js";
import { openPanel } from "./navigation.js";
import { toast } from "./toast.js";
export { toast };

export function qtyControl(id, qty) {
  return `<div class="qty" data-qty-for="${id}">
    <button type="button" data-qty-step="-1" aria-label="Decrease quantity"><i data-lucide="minus"></i></button>
    <span aria-live="polite">${qty}</span>
    <button type="button" data-qty-step="1" aria-label="Increase quantity"><i data-lucide="plus"></i></button>
  </div>`;
}

export function lineMarkup(item, { large = false } = {}) {
  const p = item.product;
  return `<article class="line ${large ? "line--large" : ""}" data-line="${p.id}">
    <a class="line__img" href="product.html?id=${p.id}"><img src="${getThumb(p.id)}" alt="${p.name}" loading="lazy" /></a>
    <div class="line__info">
      <a class="line__name" href="product.html?id=${p.id}">${p.name}</a>
      <span class="line__meta">${p.categoryLabel}</span>
      <div class="line__row">
        ${qtyControl(p.id, item.qty)}
        <button class="line__remove" type="button" data-remove="${p.id}"><i data-lucide="trash-2"></i><span>Remove</span></button>
      </div>
    </div>
    <span class="line__price">${formatPrice(item.line)}</span>
  </article>`;
}

function shipProgress(subtotal) {
  if (subtotal <= 0) return "";
  const left = FREE_SHIPPING_THRESHOLD - subtotal;
  const pct = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);
  const msg =
    left > 0
      ? `Add ${formatPrice(left)} more for free standard shipping`
      : "Free standard shipping unlocked";
  return `<p>${msg}</p><div class="meter"><span style="width:${pct}%"></span></div>`;
}

function renderDrawer() {
  const list = document.querySelector("[data-cart-list]");
  const foot = document.querySelector("[data-cart-foot]");
  const ship = document.querySelector("[data-ship-progress]");
  if (!list) return;
  const cart = getCart();
  const t = cartTotals();
  document.querySelectorAll("[data-cart-count]").forEach((el) => {
    el.textContent = t.count;
    el.classList.toggle("is-empty", t.count === 0);
  });
  const lbl = document.querySelector("[data-cart-count-label]");
  if (lbl) lbl.textContent = t.count ? `(${t.count})` : "";
  ship.innerHTML = shipProgress(t.subtotal);

  if (!cart.length) {
    list.innerHTML = `<div class="empty">
      <div class="empty__icon"><i data-lucide="package"></i></div>
      <h3>Your cart is empty</h3>
      <p>Pick a ready-to-run robot or a kit to build yourself.</p>
      <div class="empty__actions">
        <a class="btn btn--primary btn--sm" href="shop.html">Shop GAJJU</a>
      </div>
    </div>`;
    foot.innerHTML = "";
  } else {
    list.innerHTML = cart.map((i) => lineMarkup(i)).join("");
    foot.innerHTML = `
      <dl class="totals">
        <div><dt>Subtotal</dt><dd>${formatPrice(t.subtotal)}</dd></div>
        ${t.discount ? `<div><dt>Discount (${t.promo.code})</dt><dd>−${formatPrice(t.discount)}</dd></div>` : ""}
        <div><dt>Shipping</dt><dd>${t.shipping === 0 ? "Free" : formatPrice(t.shipping)}</dd></div>
        <div class="totals__grand"><dt>Total</dt><dd>${formatPrice(t.total)}</dd></div>
      </dl>
      <div class="drawer__cta">
        <a class="btn btn--ghost" href="cart.html">View cart</a>
        <a class="btn btn--primary" href="checkout.html"><i data-lucide="lock"></i>Checkout</a>
      </div>`;
  }
  refreshIcons();
}

function bumpBadge() {
  document
    .querySelectorAll("[data-cart-count]")
    .forEach((el) =>
      gsap.fromTo(
        el,
        { scale: 1.6 },
        { scale: 1, duration: 0.5, ease: "elastic.out(1, 0.4)" },
      ),
    );
}

export function initCartUI() {
  renderDrawer();
  onCartChange(renderDrawer);
  window.addEventListener("cart:added", (e) => {
    bumpBadge();
    const p = getProduct(e.detail.id);
    toast(`${p.name} added to cart`);
  });

  document.addEventListener("click", (e) => {
    const add = e.target.closest("[data-add-to-cart]");
    if (add) {
      e.preventDefault();
      const id = add.dataset.addToCart;
      const src =
        add.dataset.qtySource && document.querySelector(add.dataset.qtySource);
      const qty = src ? Number(src.dataset.value || src.textContent) || 1 : 1;
      addToCart(id, qty);
      if (add.dataset.openCart !== "false")
        setTimeout(() => openPanel("cart"), 150);
      return;
    }
    const step = e.target.closest("[data-qty-step]");
    const qtyWrap = step && step.closest("[data-qty-for]");
    if (qtyWrap && !qtyWrap.hasAttribute("data-local")) {
      const id = qtyWrap.dataset.qtyFor;
      const item = getCart().find((i) => i.id === id);
      if (item) setQty(id, item.qty + Number(step.dataset.qtyStep));
      return;
    }
    const rm = e.target.closest("[data-remove]");
    if (rm) {
      const id = rm.dataset.remove;
      const line = rm.closest("[data-line]");
      const done = () => {
        removeItem(id);
        toast(`${getProduct(id).name} removed`, "trash-2");
      };
      if (line)
        gsap.to(line, { opacity: 0, x: 30, duration: 0.25, onComplete: done });
      else done();
    }
  });
}
