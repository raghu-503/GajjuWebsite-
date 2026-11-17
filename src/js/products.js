import * as THREE from "three";
import { createGajjuViewer } from "./gajju-viewer.js";
import { PRODUCTS, KIT_COMPONENTS, formatPrice } from "./data.js";
import { productCard, initProductCards, PRODUCT_GRID } from "./product-card.js";
import { FREE_SHIPPING_THRESHOLD } from "./cart.js";
import { getProductImages } from "./product-images.js";
import { componentIcon } from "./component-icons.js";

/** Product viewer: the real GAJJU CAD model. */
export function createProductViewer(host, id, { explode = 0, ...rest } = {}) {
  return createGajjuViewer(host, { explode, zoomOnEngage: true, ...rest });
}

/**
 * Store-style gallery: product photos first, with a "3D view" thumbnail at the end.
 * The 3D viewer is created only when that thumbnail is first opened (`on3D`).
 */
export function initGallery(visualRoot, id, { on3D } = {}) {
  const thumbs = visualRoot.querySelector("[data-thumbs]");
  const photo = visualRoot.querySelector("[data-photo]");
  const img = photo?.querySelector("img");
  const stageEl = visualRoot.querySelector(".prod__stage, .pdp__stage");
  if (!thumbs) return;
  const images = getProductImages(id);
  thumbs.innerHTML =
    images
      .map(
        (im, i) =>
          `<button type="button" class="thumb" role="tab" aria-selected="false" data-view="${i}"><img src="${im.src}" alt="${im.alt}" /></button>`,
      )
      .join("") +
    `<button type="button" class="thumb thumb--3d" role="tab" aria-selected="false" data-view="3d"><i data-lucide="move-3d"></i><span>3D view</span></button>`;
  let started = false;
  const show = (view) => {
    thumbs.querySelectorAll(".thumb").forEach((t) => {
      const on = t.dataset.view === String(view);
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", String(on));
    });
    const is3d = view === "3d";
    visualRoot.classList.toggle("is-photo", !is3d);
    stageEl.classList.toggle("is-dimmed", !is3d);
    photo.hidden = is3d;
    if (is3d) {
      if (!started && on3D) {
        started = true;
        on3D();
      }
      return;
    }
    const im = getProductImages(id)[Number(view)]; // read fresh: photos arrive once the model loads
    img.src = im.src;
    img.alt = im.alt;
  };
  thumbs.addEventListener("click", (e) => {
    const b = e.target.closest("[data-view]");
    if (b) show(b.dataset.view);
  });
  show(images.length ? 0 : "3d");
}

export function priceMarkup(p) {
  return `<span class="price__now">${formatPrice(p.price)}</span>${p.compareAt ? `<s class="price__was">${formatPrice(p.compareAt)}</s>` : ""}<span class="price__note">${p.price >= FREE_SHIPPING_THRESHOLD ? "Free shipping" : "Ships in 2 days"}</span>`;
}

export function componentsMarkup() {
  return KIT_COMPONENTS.map(
    (c) => `<li class="comp" data-kind="${c.id}" tabindex="0">
      ${componentIcon(c.icon)}
      <div class="comp__text"><strong>${c.name}</strong><span>${c.spec}</span></div>
      <span class="comp__qty">×${c.qty}</span>
    </li>`,
  ).join("");
}

/** Home page products: the same e-commerce card as the shop. */
export function initShowcase(root) {
  const grid = root.querySelector("[data-home-listing]");
  grid.className = PRODUCT_GRID;
  grid.innerHTML = PRODUCTS.map((p) =>
    productCard(p, { headingTag: "h3" }),
  ).join("");
  initProductCards();
}

export { THREE };
