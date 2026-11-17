import gsap from "gsap";
import { PRODUCTS, KIT_COMPONENTS, LESSONS, formatPrice } from "./data.js";
import { load, save, remove } from "./storage.js";
import { refreshIcons } from "./icons.js";
import { toast } from "./toast.js";

let scrollLock = { stop() {}, start() {} };
export const setScrollLock = (impl) => (scrollLock = impl);

let openName = null;
let lastFocus = null;

export function openPanel(name) {
  if (openName === name) return;
  if (openName) closePanels(true);
  const panel = document.querySelector(`[data-panel="${name}"]`);
  if (!panel) return;
  lastFocus = document.activeElement;
  openName = name;
  panel.classList.add("is-open");
  panel.setAttribute("aria-hidden", "false");
  if (name !== "menu")
    document.querySelector("[data-scrim]").classList.add("is-open");
  document.documentElement.classList.add("has-panel");
  document
    .querySelector('[data-open="menu"]')
    ?.setAttribute("aria-expanded", String(name === "menu"));
  if (name === "menu")
    document.querySelector("[data-nav]").classList.add("is-menu");
  scrollLock.stop();
  if (name === "search") renderAccountless();
  if (name === "account") renderAccount();
  setTimeout(() => {
    const f =
      panel.querySelector("input, button:not([data-close]), a[href]") ||
      panel.querySelector("button");
    f?.focus({ preventScroll: true });
  }, 60);
}

export function closePanels(silent = false) {
  if (!openName) return;
  const panel = document.querySelector(`[data-panel="${openName}"]`);
  panel?.classList.remove("is-open");
  panel?.setAttribute("aria-hidden", "true");
  document.querySelector("[data-scrim]").classList.remove("is-open");
  document.documentElement.classList.remove("has-panel");
  document.querySelector("[data-nav]").classList.remove("is-menu");
  document
    .querySelector('[data-open="menu"]')
    ?.setAttribute("aria-expanded", "false");
  openName = null;
  scrollLock.start();
  if (!silent) lastFocus?.focus?.({ preventScroll: true });
}

/* ------------------------------ Active indicator ------------------------------ */
function moveIndicator(id) {
  const nav = document.querySelector(".nav__links");
  const ind = nav?.querySelector(".nav__indicator");
  document.querySelectorAll("[data-nav-link]").forEach((a) => {
    const on = a.dataset.navLink === id;
    a.classList.toggle("is-active", on);
    if (on) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
  const link = nav?.querySelector(`[data-nav-link="${id}"]`);
  if (!ind || !link) return;
  ind.style.opacity = "1";
  ind.style.transform = `translateX(${link.offsetLeft}px)`;
  ind.style.width = `${link.offsetWidth}px`;
}

function initActive(page) {
  if (page !== "home") {
    const map = {
      shop: "products",
      product: "products",
      cart: "products",
      checkout: "products",
    };
    requestAnimationFrame(() => moveIndicator(map[page] || "home"));
    window.addEventListener("resize", () => moveIndicator(map[page] || "home"));
    return;
  }
  const sections = [...document.querySelectorAll("[data-nav-section]")];
  let current = "home";
  const update = () => {
    const mid = window.innerHeight * 0.4;
    for (const s of sections) {
      const r = s.getBoundingClientRect();
      if (r.top <= mid && r.bottom > mid) {
        if (s.dataset.navSection !== current) {
          current = s.dataset.navSection;
          moveIndicator(current);
        }
        break;
      }
    }
  };
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", () => moveIndicator(current));
  requestAnimationFrame(() => {
    moveIndicator(current);
    update();
  });
}

/* ------------------------------ Search ------------------------------ */
const INDEX = [
  ...PRODUCTS.map((p) => ({
    type: "Product",
    title: p.name,
    text: `${p.description} ${p.features.join(" ")}`,
    href: `product.html?id=${p.id}`,
    meta: formatPrice(p.price),
  })),
  ...KIT_COMPONENTS.map((c) => ({
    type: "Kit part",
    title: c.name,
    text: c.desc,
    href: `product.html?id=GAJJU-kit#components`,
    meta: c.spec,
  })),
  ...LESSONS.map((l) => ({
    type: "Lesson",
    title: l.title,
    text: l.summary,
    href: `index.html#learn`,
    meta: `${l.mins} min`,
  })),
  {
    type: "Page",
    title: "3D robot explorer",
    text: "inspect components exploded view rotate zoom",
    href: "index.html#explore",
    meta: "Interactive",
  },
  {
    type: "Page",
    title: "Assembly guide",
    text: "step by step build torso electronics legs head trunk gripper",
    href: "index.html#assembly",
    meta: "7 steps",
  },
];

function highlight(text, q) {
  if (!q) return text;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  return i < 0
    ? text
    : `${text.slice(0, i)}<mark>${text.slice(i, i + q.length)}</mark>${text.slice(i + q.length)}`;
}

function renderSearch(q) {
  const box = document.querySelector("[data-search-results]");
  const query = q.trim().toLowerCase();
  if (!query) {
    box.innerHTML = `<p class="search__hint">Try “servo”, “gripper”, “camera” or “battery”.</p>
      <div class="search__quick">${PRODUCTS.map((p) => `<a href="product.html?id=${p.id}">${p.name}</a>`).join("")}<a href="index.html#explore">3D explorer</a></div>`;
    return;
  }
  const terms = query.split(/\s+/);
  const hits = INDEX.filter((r) =>
    terms.every((t) =>
      `${r.title} ${r.text} ${r.type}`.toLowerCase().includes(t),
    ),
  ).slice(0, 8);
  box.innerHTML = hits.length
    ? `<ul>${hits
        .map(
          (h) => `<li><a href="${h.href}" class="search__hit">
            <span class="search__type">${h.type}</span>
            <span class="search__title">${highlight(h.title, terms[0])}</span>
            <span class="search__meta">${h.meta}</span></a></li>`,
        )
        .join("")}</ul>`
    : `<p class="search__hint">Nothing matches “${q.replace(/</g, "&lt;")}”. Try a part name like “battery” or a topic like “motor control”.</p>`;
}
function renderAccountless() {
  const input = document.querySelector("[data-search-input]");
  renderSearch(input.value);
}

/* ------------------------------ Account ------------------------------ */
function renderAccount() {
  const body = document.querySelector("[data-account-body]");
  const user = load("user", null);
  const orders = load("orders", []);
  if (!user) {
    body.innerHTML = `
      <form class="form account-form" data-account-form novalidate>
        <p class="muted">Sign in to see your orders and save checkout details. This is a demo, so nothing leaves your browser.</p>
        <label class="field"><span>Name</span><input name="name" autocomplete="name" required /></label>
        <label class="field"><span>Email</span><input name="email" type="email" autocomplete="email" required /></label>
        <p class="form-msg" data-account-msg></p>
        <button class="btn btn--primary btn--block" type="submit">Sign in</button>
      </form>`;
  } else {
    body.innerHTML = `
      <div class="account">
        <div class="account__who"><span class="avatar">${user.name.charAt(0).toUpperCase()}</span><div><strong>${user.name}</strong><span class="muted">${user.email}</span></div></div>
        <h3>Recent orders</h3>
        ${
          orders.length
            ? `<ul class="account__orders">${orders
                .slice(-5)
                .reverse()
                .map(
                  (o) =>
                    `<li><span>${o.number}</span><span class="muted">${new Date(o.date).toLocaleDateString()}</span><strong>${formatPrice(o.total)}</strong></li>`,
                )
                .join("")}</ul>`
            : `<p class="muted">No orders yet. Your demo orders will appear here.</p>`
        }
        <button class="btn btn--ghost btn--block" data-signout><i data-lucide="log-out"></i>Sign out</button>
      </div>`;
  }
  refreshIcons();
}

/* ------------------------------ Init ------------------------------ */
export function initNavigation(page) {
  const nav = document.querySelector("[data-nav]");
  const onScroll = () =>
    nav.classList.toggle("is-scrolled", window.scrollY > 40);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  initActive(page);

  document.addEventListener("click", (e) => {
    const opener = e.target.closest("[data-open]");
    if (opener) {
      const name = opener.dataset.open;
      if (name === "menu" && openName === "menu") closePanels();
      else openPanel(name);
      return;
    }
    if (e.target.closest("[data-close]") || e.target.matches("[data-scrim]"))
      closePanels();
    if (e.target.closest(".mnav__link, .search__hit, .search__quick a"))
      closePanels(true);
    if (e.target.closest("[data-signout]")) {
      remove("user");
      renderAccount();
      toast("Signed out", "log-out");
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closePanels();
    if (
      e.key === "/" &&
      !openName &&
      !/input|textarea|select/i.test(document.activeElement.tagName)
    ) {
      e.preventDefault();
      openPanel("search");
    }
    if (e.key === "Tab" && openName) {
      const panel = document.querySelector(`[data-panel="${openName}"]`);
      const f = [
        ...panel.querySelectorAll("a[href], button, input, select, textarea"),
      ].filter((el) => el.offsetParent);
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) {
        e.preventDefault();
        f.at(-1).focus();
      } else if (!e.shiftKey && document.activeElement === f.at(-1)) {
        e.preventDefault();
        f[0].focus();
      }
    }
  });

  const input = document.querySelector("[data-search-input]");
  input.addEventListener("input", () => renderSearch(input.value));
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") document.querySelector(".search__hit")?.click();
  });

  document.addEventListener("submit", (e) => {
    if (e.target.matches("[data-account-form]")) {
      e.preventDefault();
      const f = e.target;
      const name = f.name.value.trim();
      const email = f.email.value.trim();
      const msg = f.querySelector("[data-account-msg]");
      if (!name || !/^\S+@\S+\.\S+$/.test(email)) {
        msg.textContent = "Enter your name and a valid email address.";
        msg.className = "form-msg is-error";
        return;
      }
      save("user", { name, email });
      renderAccount();
      toast(`Signed in as ${name}`, "user");
    }
    if (e.target.matches("[data-newsletter]")) {
      e.preventDefault();
      const field = e.target.querySelector("input");
      const msg = e.target.querySelector("[data-news-msg]");
      if (!/^\S+@\S+\.\S+$/.test(field.value.trim())) {
        msg.textContent = "Enter a valid email address, like name@example.com.";
        msg.className = "form-msg is-error";
        return;
      }
      save("newsletter", field.value.trim());
      msg.textContent =
        "Subscribed. The next build note arrives on the first of the month.";
      msg.className = "form-msg is-ok";
      field.value = "";
    }
  });

  // Mobile menu link stagger
  const mnav = document.querySelector(".mnav");
  new MutationObserver(() => {
    if (mnav.classList.contains("is-open"))
      gsap.fromTo(
        ".mnav__link",
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.06, duration: 0.5, ease: "power3.out" },
      );
  }).observe(mnav, { attributes: true, attributeFilter: ["class"] });
}
