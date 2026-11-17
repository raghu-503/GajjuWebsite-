export const LOGO = `
<svg class="logo-mark" viewBox="0 0 40 40" aria-hidden="true">
  <path class="logo-mark__frame" d="M20 2.5 35.2 11.25v17.5L20 37.5 4.8 28.75v-17.5Z" fill="none" stroke="currentColor" stroke-width="2"/>
  <path class="logo-mark__n" d="M25.5 15.2A7 7 0 1 0 27 20.5H20.5" fill="none" style="stroke: var(--cyan)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
  <circle class="logo-mark__dot" cx="27" cy="13" r="2.2" style="fill: var(--cyan)"/>
</svg>`;

const LINKS = [
  { id: "home", label: "Home", href: "index.html" },
  { id: "explore", label: "Explore", href: "index.html#explore" },
  { id: "products", label: "Products", href: "shop.html" },
  { id: "learn", label: "Learn", href: "index.html#learn" },
  { id: "about", label: "About", href: "index.html#about" },
];

export function renderLayout(page) {
  const links = LINKS.map(
    (l) =>
      `<a class="nav__link" data-nav-link="${l.id}" href="${l.href}">${l.label}</a>`,
  ).join("");
  const mobileLinks = LINKS.map(
    (l, i) =>
      `<a class="mnav__link" data-nav-link="${l.id}" href="${l.href}" style="--i:${i}">${l.label}</a>`,
  ).join("");

  document.body.insertAdjacentHTML(
    "afterbegin",
    `
<a class="skip-link" href="#main">Skip to content</a>
<div class="loader" data-loader aria-hidden="true">
  <div class="loader__inner">
    ${LOGO}
    <div class="loader__bar"><span data-loader-bar></span></div>
    <p class="loader__label" data-loader-label>Initialising systems</p>
  </div>
</div>
<div class="curtain" data-curtain aria-hidden="true"></div>
<div class="cursor" aria-hidden="true"><span class="cursor__dot"></span><span class="cursor__ring"></span></div>

<header class="nav" data-nav>
  <a class="nav__brand" href="index.html" aria-label="Gajju home">${LOGO}<span class="nav__wordmark">Gajju</span></a>
  <nav class="nav__links" aria-label="Primary">${links}<span class="nav__indicator" aria-hidden="true"></span></nav>
  <div class="nav__actions">
    <button class="icon-btn theme-toggle" data-theme-toggle aria-label="Switch to dark theme"><i data-lucide="moon" class="theme-toggle__moon"></i><i data-lucide="sun" class="theme-toggle__sun"></i></button>
    <button class="icon-btn" data-open="search" aria-label="Search"><i data-lucide="search"></i></button>
    <button class="icon-btn" data-open="account" aria-label="Account"><i data-lucide="user"></i></button>
    <button class="icon-btn icon-btn--cart" data-open="cart" aria-label="Cart">
      <i data-lucide="shopping-bag"></i><span class="cart-count" data-cart-count>0</span>
    </button>
    <button class="icon-btn nav__burger" data-open="menu" aria-label="Open menu" aria-expanded="false"><i data-lucide="menu"></i></button>
  </div>
</header>

<div class="mnav" data-panel="menu" aria-hidden="true">
  <nav class="mnav__links" aria-label="Mobile">${mobileLinks}</nav>
  <div class="mnav__foot">
    <a class="btn btn--ghost" href="shop.html">Shop robots</a>
    <a class="btn btn--primary" href="product.html?id=GAJJU-kit">Build your own</a>
  </div>
</div>

<div class="scrim" data-scrim></div>

<aside class="drawer" data-panel="cart" aria-label="Shopping cart" aria-hidden="true">
  <div class="drawer__head">
    <h2>Your cart <span class="drawer__count" data-cart-count-label></span></h2>
    <button class="icon-btn" data-close aria-label="Close cart"><i data-lucide="x"></i></button>
  </div>
  <div class="drawer__ship" data-ship-progress></div>
  <div class="drawer__body" data-cart-list></div>
  <div class="drawer__foot" data-cart-foot></div>
</aside>

<div class="search" data-panel="search" role="dialog" aria-modal="true" aria-label="Search" aria-hidden="true">
  <div class="search__box">
    <div class="search__field">
      <i data-lucide="search"></i>
      <input type="search" placeholder="Search robots, parts and lessons" data-search-input aria-label="Search" autocomplete="off" />
      <button class="icon-btn" data-close aria-label="Close search"><i data-lucide="x"></i></button>
    </div>
    <div class="search__results" data-search-results></div>
  </div>
</div>

<aside class="drawer drawer--account" data-panel="account" aria-label="Account" aria-hidden="true">
  <div class="drawer__head">
    <h2>Account</h2>
    <button class="icon-btn" data-close aria-label="Close account"><i data-lucide="x"></i></button>
  </div>
  <div class="drawer__body" data-account-body></div>
</aside>

<div class="toasts" data-toasts aria-live="polite"></div>
`,
  );

  document.body.insertAdjacentHTML(
    "beforeend",
    `
<footer class="footer">
  <div class="footer__top">
    <div class="footer__brand">
      <a class="nav__brand" href="index.html">${LOGO}<span class="nav__wordmark">Gajju</span></a>
      <p>Robots you can own, open up and understand. Designed in Hyderabad and Eindhoven.</p>
    </div>
    <div class="footer__cols">
      <div><h3>Shop</h3><a href="product.html?id=GAJJU">GAJJU Fully Assembled</a><a href="product.html?id=GAJJU-kit">GAJJU DIY Parts Kit</a><a href="shop.html">Shop</a></div>
      <div><h3>Learn</h3><a href="index.html#learn">Lessons</a><a href="index.html#assembly">Assembly guide</a><a href="index.html#explore">3D explorer</a></div>
      <div><h3>Company</h3><a href="index.html#about">About</a><a href="index.html#contact">Contact</a><a href="cart.html">Cart</a></div>
    </div>
    <form class="footer__news" data-newsletter novalidate>
      <label for="news-email">Build notes, once a month</label>
      <div class="field-inline">
        <input id="news-email" type="email" placeholder="you@example.com" required />
        <button class="btn btn--primary btn--sm" type="submit">Subscribe</button>
      </div>
      <p class="form-msg" data-news-msg></p>
    </form>
  </div>
  <div class="footer__bottom">
    <span>© 2026 Gajju. Prototype storefront, no real orders are placed.</span>
    <a href="#main" data-to-top>Back to top</a>
  </div>
</footer>`,
  );

  document.body.dataset.page = page;
}
