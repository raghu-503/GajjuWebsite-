import { initSite } from "./main.js";
import {
  getCart,
  cartTotals,
  onCartChange,
  clearCart,
  clearPromo,
  SHIPPING_METHODS,
  FREE_SHIPPING_THRESHOLD,
} from "./cart.js";
import { summaryMarkup, bindPromo } from "./summary.js";
import { formatPrice, getProduct } from "./data.js";
import { getThumb } from "./product-images.js";
import { load, save } from "./storage.js";
import { refreshIcons } from "./icons.js";
import { gsap, reduced, scrollToTarget } from "./animations.js";

const site = initSite("checkout");
const root = document.querySelector("[data-checkout]");
let method = "standard";
let done = false;

const field = (name, label, attrs = "", full = false) =>
  `<label class="field ${full ? "field--full" : ""}" data-field="${name}"><span>${label}</span><input name="${name}" ${attrs} /><small class="field__err" aria-live="polite"></small></label>`;

function stepsBar(active) {
  const steps = ["Cart", "Details and payment", "Confirmation"];
  return `<ol class="co-steps" aria-label="Checkout progress">${steps
    .map(
      (s, i) =>
        `<li class="${i < active ? "is-done" : i === active ? "is-active" : ""}"><span>${i < active ? '<i data-lucide="check"></i>' : i + 1}</span>${i === 0 && active > 0 && active < 2 ? `<a href="cart.html">${s}</a>` : s}</li>`,
    )
    .join("")}</ol>`;
}

function summaryBlock() {
  const t = cartTotals(method);
  return `<h2>Order summary</h2>
    <ul class="co-lines">${getCart()
      .map(
        (i) =>
          `<li><span class="co-lines__img"><img src="${getThumb(i.id)}" alt="" /><b>${i.qty}</b></span><span class="co-lines__name">${i.product.name}<small>${i.product.categoryLabel}</small></span><span>${formatPrice(i.line)}</span></li>`,
      )
      .join("")}</ul>
    ${summaryMarkup(t, { cta: false })}`;
}

function renderForm() {
  const cart = getCart();
  if (!cart.length) {
    root.innerHTML = `${stepsBar(1)}<div class="empty empty--page">
      <div class="empty__icon"><i data-lucide="shopping-bag"></i></div>
      <h1>There’s nothing to check out yet</h1>
      <p>Add a robot or a kit to your cart, then come back here to place your order.</p>
      <div class="empty__actions"><a class="btn btn--primary" href="shop.html">Browse products</a></div>
    </div>`;
    refreshIcons();
    return;
  }
  const user = load("user", null);
  const saved = load("checkout-info", {});
  const v = (k) => saved[k] || "";
  const sub = cartTotals("standard").subtotal;

  root.innerHTML = `
  ${stepsBar(1)}
  <div class="checkout">
    <form class="checkout__form" data-co-form novalidate>
      <section class="co-sec">
        <h2><span class="co-num">1</span>Contact</h2>
        <div class="form-grid">
          ${field("email", "Email", `type="email" autocomplete="email" required value="${v("email") || user?.email || ""}"`)}
          ${field("phone", "Phone", `type="tel" autocomplete="tel" required value="${v("phone")}" placeholder="+91 98765 43210"`)}
        </div>
      </section>

      <section class="co-sec">
        <h2><span class="co-num">2</span>Shipping address</h2>
        <div class="form-grid">
          ${field("first", "First name", `autocomplete="given-name" required value="${v("first") || user?.name?.split(" ")[0] || ""}"`)}
          ${field("last", "Last name", `autocomplete="family-name" required value="${v("last") || user?.name?.split(" ").slice(1).join(" ") || ""}"`)}
          ${field("address", "Street address", `autocomplete="address-line1" required value="${v("address")}"`, true)}
          ${field("address2", "Apartment, suite (optional)", `autocomplete="address-line2" value="${v("address2")}"`, true)}
          ${field("city", "City", `autocomplete="address-level2" required value="${v("city")}"`)}
          ${field("postal", "Postal code", `autocomplete="postal-code" required value="${v("postal")}"`)}
          <label class="field field--full" data-field="country"><span>Country</span>
            <select name="country" autocomplete="country-name" required>
              ${["India", "United States", "United Kingdom", "Germany", "Netherlands", "Singapore", "Australia", "Canada"].map((c) => `<option ${(v("country") || "India") === c ? "selected" : ""}>${c}</option>`).join("")}
            </select><small class="field__err"></small></label>
        </div>
      </section>

      <section class="co-sec">
        <h2><span class="co-num">3</span>Shipping method</h2>
        <div class="radio-cards" role="radiogroup" aria-label="Shipping method">
          ${Object.values(SHIPPING_METHODS)
            .map((m) => {
              const price =
                m.id === "standard" && sub >= FREE_SHIPPING_THRESHOLD
                  ? "Free"
                  : formatPrice(m.price);
              return `<label class="radio-card"><input type="radio" name="ship" value="${m.id}" ${method === m.id ? "checked" : ""}/><span class="radio-card__body"><i data-lucide="${m.id === "express" ? "zap" : "truck"}"></i><span><strong>${m.label}</strong><small>${m.eta}</small></span><b>${price}</b></span></label>`;
            })
            .join("")}
        </div>
      </section>

      <section class="co-sec">
        <h2><span class="co-num">4</span>Payment</h2>
        <p class="co-note"><i data-lucide="lock"></i>This is a demo checkout. No real payment is taken and nothing is sent anywhere.</p>
        <div class="pay-tabs" role="radiogroup" aria-label="Payment method">
          <label class="pay-tab"><input type="radio" name="pay" value="card" checked /><span><i data-lucide="credit-card"></i>Card</span></label>
          <label class="pay-tab"><input type="radio" name="pay" value="upi" /><span><i data-lucide="smartphone"></i>UPI</span></label>
          <label class="pay-tab"><input type="radio" name="pay" value="bank" /><span><i data-lucide="landmark"></i>Bank transfer</span></label>
        </div>
        <div class="pay-panel" data-pay="card">
          <div class="form-grid">
            ${field("cardName", "Name on card", 'autocomplete="cc-name"', true)}
            ${field("cardNumber", "Card number", 'inputmode="numeric" autocomplete="cc-number" placeholder="4242 4242 4242 4242" maxlength="19"', true)}
            ${field("cardExp", "Expiry (MM/YY)", 'inputmode="numeric" autocomplete="cc-exp" placeholder="12/29" maxlength="5"')}
            ${field("cardCvc", "Security code", 'inputmode="numeric" autocomplete="cc-csc" placeholder="123" maxlength="4"')}
          </div>
          <p class="muted co-hint">Use the test number 4242 4242 4242 4242 with any future date.</p>
        </div>
        <div class="pay-panel" data-pay="upi" hidden>
          <div class="form-grid">${field("upi", "UPI ID", 'placeholder="name@bank"', true)}</div>
          <p class="muted co-hint">You’d normally approve the request in your UPI app. In this demo, any ID in the form name@bank works.</p>
        </div>
        <div class="pay-panel" data-pay="bank" hidden>
          <p class="muted co-hint">We’ll show bank details on the confirmation screen. Your order ships once the transfer clears, usually within one working day.</p>
        </div>
      </section>

      <label class="check-line"><input type="checkbox" name="save" checked /> Save these details in this browser for next time</label>
      <button class="btn btn--primary btn--lg btn--block co-place" type="submit" data-place><i data-lucide="lock"></i><span>Place order</span></button>
    </form>

    <aside class="summary summary--sticky" data-co-summary>${summaryBlock()}</aside>
  </div>`;
  refreshIcons();
  bind();
}

const RULES = {
  email: (x) =>
    /^\S+@\S+\.\S+$/.test(x) || "Enter an email address like name@example.com.",
  phone: (x) =>
    x.replace(/\D/g, "").length >= 8 ||
    "Enter a phone number with at least 8 digits.",
  first: (x) => !!x.trim() || "Enter your first name.",
  last: (x) => !!x.trim() || "Enter your last name.",
  address: (x) => x.trim().length > 3 || "Enter your street address.",
  city: (x) => !!x.trim() || "Enter your city.",
  postal: (x) =>
    /^[A-Za-z0-9 -]{3,10}$/.test(x.trim()) || "Enter a valid postal code.",
  cardName: (x) => !!x.trim() || "Enter the name shown on the card.",
  cardNumber: (x) =>
    x.replace(/\s/g, "").length === 16 || "Card numbers have 16 digits.",
  cardExp: (x) => {
    const m = /^(\d{2})\/(\d{2})$/.exec(x);
    if (!m || +m[1] < 1 || +m[1] > 12) return "Use the format MM/YY.";
    const exp = new Date(2000 + +m[2], +m[1]);
    return exp > new Date() || "This card has expired.";
  },
  cardCvc: (x) => /^\d{3,4}$/.test(x) || "Enter the 3 or 4 digit code.",
  upi: (x) =>
    /^[\w.-]+@[\w]+$/.test(x.trim()) || "Enter a UPI ID like name@bank.",
};

function validate(form) {
  const pay = form.pay.value;
  const names = [
    "email",
    "phone",
    "first",
    "last",
    "address",
    "city",
    "postal",
  ];
  if (pay === "card")
    names.push("cardName", "cardNumber", "cardExp", "cardCvc");
  if (pay === "upi") names.push("upi");
  let first = null;
  names.forEach((n) => {
    const res = RULES[n](form[n].value);
    const wrap = form.querySelector(`[data-field="${n}"]`);
    wrap.classList.toggle("is-invalid", res !== true);
    wrap.querySelector(".field__err").textContent = res === true ? "" : res;
    form[n].setAttribute("aria-invalid", String(res !== true));
    if (res !== true && !first) first = form[n];
  });
  return first;
}

function bind() {
  const form = root.querySelector("[data-co-form]");
  const summary = root.querySelector("[data-co-summary]");
  bindPromo(summary);

  form.addEventListener("change", (e) => {
    if (e.target.name === "ship") {
      method = e.target.value;
      summary.innerHTML = summaryBlock();
      refreshIcons();
    }
    if (e.target.name === "pay") {
      root
        .querySelectorAll("[data-pay]")
        .forEach((p) => (p.hidden = p.dataset.pay !== e.target.value));
    }
  });
  form.addEventListener("input", (e) => {
    const t = e.target;
    if (t.name === "cardNumber")
      t.value = t.value
        .replace(/\D/g, "")
        .slice(0, 16)
        .replace(/(\d{4})(?=\d)/g, "$1 ");
    if (t.name === "cardExp") {
      const d = t.value.replace(/\D/g, "").slice(0, 4);
      t.value = d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
    }
    if (t.name === "cardCvc") t.value = t.value.replace(/\D/g, "").slice(0, 4);
    const wrap = t.closest(".field.is-invalid");
    if (wrap && RULES[t.name] && RULES[t.name](t.value) === true) {
      wrap.classList.remove("is-invalid");
      wrap.querySelector(".field__err").textContent = "";
    }
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const bad = validate(form);
    if (bad) {
      scrollToTarget(site.lenis, bad.closest(".co-sec"));
      setTimeout(() => bad.focus({ preventScroll: true }), 400);
      return;
    }
    const btn = form.querySelector("[data-place]");
    btn.disabled = true;
    btn.querySelector("span").textContent = "Placing order…";
    btn.classList.add("is-loading");

    if (form.save.checked) {
      const keep = {};
      [
        "email",
        "phone",
        "first",
        "last",
        "address",
        "address2",
        "city",
        "postal",
        "country",
      ].forEach((k) => (keep[k] = form[k].value));
      save("checkout-info", keep);
    }

    const t = cartTotals(method);
    const days = method === "express" ? 2 : 6;
    const eta = new Date();
    let added = 0;
    while (added < days) {
      eta.setDate(eta.getDate() + 1);
      if (eta.getDay() % 6 !== 0) added++;
    }
    const order = {
      number: `GJ-${Date.now().toString(36).toUpperCase().slice(-6)}${Math.floor(Math.random() * 90 + 10)}`,
      date: new Date().toISOString(),
      eta: eta.toISOString(),
      items: getCart().map((i) => ({ id: i.id, qty: i.qty, line: i.line })),
      totals: {
        subtotal: t.subtotal,
        discount: t.discount,
        shipping: t.shipping,
        total: t.total,
      },
      total: t.total,
      method,
      pay: form.pay.value,
      name: `${form.first.value} ${form.last.value}`.trim(),
      email: form.email.value,
      address: [
        form.address.value,
        form.address2.value,
        form.city.value,
        form.postal.value,
        form.country.value,
      ]
        .filter(Boolean)
        .join(", "),
    };
    const orders = load("orders", []);
    orders.push(order);
    save("orders", orders);

    setTimeout(
      () => {
        clearCart();
        clearPromo();
        history.replaceState(null, "", `checkout.html?order=${order.number}`);
        renderSuccess(order);
      },
      reduced ? 50 : 1200,
    );
  });
}

function renderSuccess(order) {
  done = true;
  const fmt = (d) =>
    new Date(d).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  root.innerHTML = `
  ${stepsBar(2)}
  <section class="success">
    <div class="success__mark" aria-hidden="true">
      <svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="54" class="success__ring"/><path d="M38 62l15 15 30-34" class="success__tick"/></svg>
    </div>
    <h1 class="display display--md">ORDER CONFIRMED.</h1>
    <p class="success__lead">Thanks, ${order.name.split(" ")[0]}. A confirmation is on its way to <strong>${order.email}</strong>.</p>
    <div class="success__grid">
      <div class="success__card">
        <dl class="success__meta">
          <div><dt>Order number</dt><dd class="success__num">${order.number}</dd></div>
          <div><dt>Placed</dt><dd>${fmt(order.date)}</dd></div>
          <div><dt>Shipping to</dt><dd>${order.address}</dd></div>
          <div><dt>Payment</dt><dd>${{ card: "Card (demo)", upi: "UPI (demo)", bank: "Bank transfer (demo)" }[order.pay]}</dd></div>
        </dl>
        <ul class="co-lines">${order.items
          .map((i) => {
            const p = getProduct(i.id);
            return `<li><span class="co-lines__img"><img src="${getThumb(i.id)}" alt="" /><b>${i.qty}</b></span><span class="co-lines__name">${p.name}<small>${p.categoryLabel}</small></span><span>${formatPrice(i.line)}</span></li>`;
          })
          .join("")}</ul>
        <dl class="totals">
          <div><dt>Subtotal</dt><dd>${formatPrice(order.totals.subtotal)}</dd></div>
          ${order.totals.discount ? `<div><dt>Discount</dt><dd>−${formatPrice(order.totals.discount)}</dd></div>` : ""}
          <div><dt>Shipping</dt><dd>${order.totals.shipping ? formatPrice(order.totals.shipping) : "Free"}</dd></div>
          <div class="totals__grand"><dt>Total paid</dt><dd>${formatPrice(order.total)}</dd></div>
        </dl>
      </div>
      <div class="success__card">
        <h2>Delivery status</h2>
        <ol class="track">
          <li class="is-done"><span></span><div><strong>Order placed</strong><small>${fmt(order.date)}</small></div></li>
          <li class="is-active"><span></span><div><strong>${order.pay === "bank" ? "Waiting for transfer" : "Preparing your order"}</strong><small>Final test and packing</small></div></li>
          <li><span></span><div><strong>Shipped</strong><small>Tracking link by email</small></div></li>
          <li><span></span><div><strong>Delivered</strong><small>Estimated ${fmt(order.eta)}</small></div></li>
        </ol>
        ${order.pay === "bank" ? `<p class="co-note"><i data-lucide="landmark"></i>Demo bank details: Gajju Ltd, account 0000 1111 2222, reference ${order.number}.</p>` : ""}
        <div class="success__actions">
          <a class="btn btn--primary" href="shop.html">Continue shopping</a>
          <a class="btn btn--ghost" href="index.html#learn">Start a lesson</a>
        </div>
      </div>
    </div>
  </section>`;
  refreshIcons();
  window.scrollTo(0, 0);
  if (!reduced) {
    gsap.fromTo(
      ".success__ring",
      { strokeDashoffset: 340 },
      { strokeDashoffset: 0, duration: 0.9, ease: "power3.out" },
    );
    gsap.fromTo(
      ".success__tick",
      { strokeDashoffset: 80 },
      { strokeDashoffset: 0, duration: 0.6, delay: 0.5, ease: "power3.out" },
    );
    gsap.from(".success > *:not(.success__mark)", {
      opacity: 0,
      y: 30,
      stagger: 0.1,
      duration: 0.8,
      delay: 0.3,
      ease: "power3.out",
    });
  }
}

const orderParam = new URLSearchParams(location.search).get("order");
const existing =
  orderParam && load("orders", []).find((o) => o.number === orderParam);
if (existing) renderSuccess(existing);
else {
  renderForm();
  onCartChange(() => {
    if (done) return;
    if (!root.querySelector("[data-co-form]") || !getCart().length)
      renderForm();
    else {
      const s = root.querySelector("[data-co-summary]");
      s.innerHTML = summaryBlock();
      refreshIcons();
    }
  });
}
site.hydrate();
