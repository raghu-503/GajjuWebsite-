import { initSite } from "./main.js";
import {
  getProduct,
  PRODUCTS,
  REVIEWS,
  KIT_COMPONENTS,
  formatPrice,
} from "./data.js";
import { createProductViewer, initGallery, priceMarkup } from "./products.js";
import { getProductImages } from "./product-images.js";
import { componentIcon } from "./component-icons.js";
import { addToCart } from "./cart.js";
import { stars } from "./ui.js";
import { load, save } from "./storage.js";
import { refreshIcons } from "./icons.js";
import { toast } from "./toast.js";
import { gsap, reduced } from "./animations.js";

const site = initSite("product");
const root = document.querySelector("[data-pdp]");
const id = new URLSearchParams(location.search).get("id");
const p = getProduct(id);

if (!p) {
  document.title = "Product not found · Gajju";
  root.innerHTML = `<div class="empty notfound">
    <div class="empty__icon"><i data-lucide="search"></i></div>
    <h1>We couldn’t find that product</h1>
    <p>The link may be out of date. Here’s everything we currently make.</p>
    <div class="empty__actions">${PRODUCTS.map((x) => `<a class="btn btn--ghost" href="product.html?id=${x.id}">${x.name}</a>`).join("")}<a class="btn btn--primary" href="shop.html">Go to shop</a></div>
  </div>`;
  site.hydrate();
} else {
  render();
}

function reviewsFor() {
  const extra = load(`reviews-${p.id}`, []);
  return [...extra, ...REVIEWS[p.id]];
}

function reviewMarkup(r) {
  return `<article class="review">
    <header>${stars(r.rating)}<strong>${r.title}</strong></header>
    <p>${r.body}</p>
    <footer><span>${r.name}</span><span class="muted">${r.date}</span>${r.verified !== false ? '<span class="pill">Verified buyer</span>' : ""}</footer>
  </article>`;
}

function render() {
  document.title = `${p.name} · Gajju`;
  const kit = p.category === "diy"; // DIY parts kit vs fully assembled GAJJU
  const other = PRODUCTS.find((x) => x.id !== p.id);
  const dist = [5, 4, 3, 2, 1].map((s) => ({
    s,
    pct: {
      5: kit ? 82 : 76,
      4: kit ? 14 : 18,
      3: kit ? 3 : 4,
      2: 1,
      1: kit ? 0 : 1,
    }[s],
  }));

  root.innerHTML = `
  <nav class="crumbs" aria-label="Breadcrumb">
    <a href="shop.html">Shop</a><i data-lucide="chevron-right"></i>
    <a href="shop.html?cat=${p.category}">${p.categoryLabel}</a><i data-lucide="chevron-right"></i>
    <span aria-current="page">${p.name}</span>
  </nav>

  <section class="pdp pdp--kit">
    <div class="pdp__visual studio">
      <div class="pdp__stage" data-pdp-stage data-cursor="drag"></div>
      <figure class="prod__photo" data-photo hidden><img alt="" /></figure>
      <p class="prod__hint"><i data-lucide="hand"></i>Drag to rotate, right-drag to pan, click then scroll to zoom. Click a part to inspect it.</p>
      <div class="prod__thumbs" data-thumbs role="tablist" aria-label="Product views"></div>
    </div>

    <div class="pdp__info">
      <span class="prod__tag"><b>${p.sku}</b>${p.categoryLabel}</span>
      <h1 class="pdp__name">${p.name}</h1>
      <a class="listing__rating" href="#reviews">${stars(p.rating)}<span>${p.rating} from ${p.reviewCount + load(`reviews-${p.id}`, []).length} reviews</span></a>
      <div class="price">${priceMarkup(p)}</div>
      <p class="pdp__desc">${p.description}</p>
      <ul class="checks">${p.features.map((f) => `<li><i data-lucide="check"></i>${f}</li>`).join("")}</ul>
      ${
        kit
          ? `<div class="kit-meta kit-meta--pdp">
          <div class="kit-meta__item"><span>Assembly difficulty</span><div class="difficulty" aria-label="Difficulty ${p.difficulty} out of 5">${[1, 2, 3, 4, 5].map((i) => `<i class="${i <= p.difficulty ? "on" : ""}"></i>`).join("")}</div><strong>${p.difficultyLabel}</strong></div>
          <div class="kit-meta__item"><span>CAD parts</span><strong class="kit-meta__big">104</strong></div>
        </div>`
          : ""
      }
      <div class="pdp__buy">
        <div class="qty qty--lg" data-qty-for="${p.id}" data-local>
          <button type="button" data-qty-step="-1" aria-label="Decrease quantity"><i data-lucide="minus"></i></button>
          <span id="pdp-qty" data-value="1">1</span>
          <button type="button" data-qty-step="1" aria-label="Increase quantity"><i data-lucide="plus"></i></button>
        </div>
        <button class="btn btn--primary btn--lg" data-add-to-cart="${p.id}" data-qty-source="#pdp-qty"><i data-lucide="shopping-bag"></i>Add to cart</button>
        <button class="btn btn--ghost btn--lg" data-buy-now><i data-lucide="zap"></i>Buy now</button>
      </div>
      <ul class="assurances">
        <li><i data-lucide="truck"></i><span>Free standard shipping, 4–6 days</span></li>
        <li><i data-lucide="shield-check"></i><span>${kit ? "1-year parts guarantee" : "2-year warranty"}, 30-day returns</span></li>
      </ul>
    </div>
  </section>

  <nav class="pdp-tabs" aria-label="Product sections">
    <a href="#overview">Overview</a><a href="#specs">Specifications</a><a href="#components">Components</a><a href="#reviews">Reviews</a>
  </nav>

  <section class="pdp-sec pdp-overview" id="overview">
    <h2 class="display display--md" data-split>${kit ? "BUILD IT. UNDERSTAND IT." : "SWITCH IT ON. WATCH IT WALK."}</h2>
    <p class="pdp-overview__long" data-reveal>${p.long}</p>
    <div class="pdp-overview__shots">${getProductImages(p.id)
      .slice(1, 4)
      .map(
        (im) =>
          `<figure data-reveal><img src="${im.src}" alt="${im.alt}" loading="lazy" /></figure>`,
      )
      .join("")}</div>
  </section>

  <section class="pdp-sec pdp-specs" id="specs">
    <div>
      <h2 class="pdp-h">Specifications</h2>
      <dl class="spec-table">${p.specs.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("")}</dl>
    </div>
    <div class="pdp-specs__side">
      <h2 class="pdp-h">Technical details</h2>
      <dl class="spec-table">${p.technical.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("")}</dl>
      <h2 class="pdp-h">What’s included</h2>
      <ul class="included">${p.included.map((x) => `<li><i data-lucide="package"></i>${x}</li>`).join("")}</ul>
    </div>
  </section>

  <section class="pdp-sec" id="components">
      <h2 class="pdp-h">${kit ? "Component breakdown" : "What’s inside"}</h2>
      <p class="muted pdp-sub">${kit ? "Every part in the tray, what it does, and how many you get." : "Every part inside your assembled GAJJU, and what it does."}</p>
      <div class="breakdown">${KIT_COMPONENTS.map(
        (c) => `<article class="bd" data-reveal>
          ${componentIcon(c.icon)}
          <div><h3>${c.name}</h3><p>${c.desc}</p></div>
          <dl><div><dt>Qty</dt><dd>${c.qty}</dd></div><div><dt>Spec</dt><dd>${c.spec}</dd></div></dl>
        </article>`,
      ).join("")}</div>
    </section>

  <section class="pdp-sec reviews" id="reviews">
    <div class="reviews__summary">
      <h2 class="pdp-h">Customer reviews</h2>
      <div class="reviews__score"><strong>${p.rating}</strong>${stars(p.rating)}<span class="muted">${p.reviewCount} reviews</span></div>
      <ul class="reviews__dist">${dist.map((d) => `<li><span>${d.s}</span><div class="meter"><span style="width:${d.pct}%"></span></div><span class="muted">${d.pct}%</span></li>`).join("")}</ul>
      <form class="form review-form" data-review-form novalidate>
        <h3>Write a review</h3>
        <fieldset class="rate-input"><legend class="sr-only">Rating</legend>
          ${[5, 4, 3, 2, 1].map((n) => `<input type="radio" name="rating" id="r${n}" value="${n}" ${n === 5 ? "checked" : ""}/><label for="r${n}" aria-label="${n} stars"><i data-lucide="star"></i></label>`).join("")}
        </fieldset>
        <label class="field"><span>Name</span><input name="name" required /></label>
        <label class="field"><span>Headline</span><input name="title" required /></label>
        <label class="field"><span>Review</span><textarea name="body" rows="3" required></textarea></label>
        <p class="form-msg" data-review-msg></p>
        <button class="btn btn--ghost" type="submit">Post review</button>
      </form>
    </div>
    <div class="reviews__list" data-review-list>${reviewsFor().map(reviewMarkup).join("")}</div>
  </section>

  ${
    other
      ? `<section class="pdp-sec related">
    <h2 class="pdp-h">Also available</h2>
    <a class="related__card" href="product.html?id=${other.id}">
      <img src="${getProductImages(other.id)[0]?.src}" alt="${other.name}" />
      <div>
        <span class="prod__tag"><b>${other.sku}</b>${other.categoryLabel}</span>
        <h3>${other.name}</h3>
        <p>${other.tagline}</p>
        <span class="price__now">${formatPrice(other.price)}</span>
      </div>
      <span class="related__go"><i data-lucide="arrow-up-right"></i></span>
    </a>
  </section>`
      : ""
  }`;

  const visual = root.querySelector(".pdp__visual");
  // Photos first, like a store; the 3D viewer starts when "3D view" is opened.
  initGallery(visual, p.id, {
    on3D: () =>
      createProductViewer(root.querySelector("[data-pdp-stage]"), p.id, {
        zoom: true,
        ui: visual,
      }),
  });

  root.addEventListener("click", (e) => {
    const local = e.target.closest("[data-local] [data-qty-step]");
    if (local) {
      const span = local.parentElement.querySelector("span");
      const v = Math.max(
        1,
        Math.min(
          10,
          Number(span.dataset.value) + Number(local.dataset.qtyStep),
        ),
      );
      span.dataset.value = v;
      span.textContent = v;
    }
    if (e.target.closest("[data-buy-now]")) {
      addToCart(
        p.id,
        Number(document.querySelector("#pdp-qty").dataset.value) || 1,
      );
      setTimeout(
        () =>
          document.querySelector('a[href="checkout.html"]')?.click() ||
          (location.href = "checkout.html"),
        250,
      );
    }
  });

  root.querySelector("[data-review-form]").addEventListener("submit", (e) => {
    e.preventDefault();
    const f = e.target;
    const msg = f.querySelector("[data-review-msg]");
    const name = f.name.value.trim();
    const title = f.title.value.trim();
    const body = f.body.value.trim();
    if (!name || !title || body.length < 10) {
      msg.textContent =
        "Add your name, a headline and at least a sentence about your experience.";
      msg.className = "form-msg is-error";
      return;
    }
    const esc = (s) =>
      s.replace(
        /[<>&]/g,
        (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c],
      );
    const r = {
      name: esc(name),
      title: esc(title),
      body: esc(body),
      rating: Number(f.rating.value),
      date: "Just now",
      verified: false,
    };
    const saved = load(`reviews-${p.id}`, []);
    saved.unshift(r);
    save(`reviews-${p.id}`, saved);
    const list = root.querySelector("[data-review-list]");
    list.insertAdjacentHTML("afterbegin", reviewMarkup(r));
    refreshIcons();
    if (!reduced)
      gsap.from(list.firstElementChild, { opacity: 0, y: -20, duration: 0.5 });
    f.reset();
    msg.textContent = "Review posted. Thanks for helping other builders.";
    msg.className = "form-msg is-ok";
    toast("Review posted", "star");
  });

  site.hydrate();
}
