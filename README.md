# Gajju — Robotics website prototype

A complete frontend prototype for a robotics brand: cinematic landing page, interactive 3D
robots, DIY kit exploration, shop, product pages, cart and checkout. HTML, CSS and vanilla
JavaScript (ES modules) with Three.js, GSAP + ScrollTrigger, Lenis and Lucide, served by Vite.

## Run it

Requires Node.js 18 or newer.

```bash
npm install
npm run dev        # http://localhost:5173 (opens automatically)
```

Production build:

```bash
npm run build      # outputs to /dist
npm run preview    # serves /dist at http://localhost:4173
```

The build uses relative paths, so `/dist` can be hosted from any folder or static host.
Fonts load from Google Fonts (Archivo); offline, the site falls back to system fonts.

## Pages

| Page                                  | What it does                                                                                                                      |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `index.html`                          | Hero with 3D robot, brand intro, capabilities, product showcase, 3D explorer, 7-step assembly, learning centre, about and contact |
| `shop.html`                           | Category tabs, filter, sort, image galleries, quantity, add to cart, comparison table (`?cat=assembled` or `?cat=diy`)            |
| `product.html?id=aru-1` / `?id=rbk-2` | 3D viewer with zoom, gallery, specs, included items, kit component breakdown, reviews (you can post one), related product         |
| `cart.html`                           | Quantities, remove, clear, promo codes, shipping progress                                                                         |
| `checkout.html`                       | Validated form, shipping method, demo card / UPI / bank transfer, order confirmation (`?order=NX-…` reopens it)                   |

## Demo data to try

- Promo codes: `NEX10` (10% off), `BUILDER` (15% off)
- Test card: `4242 4242 4242 4242`, any future expiry, any 3-digit code
- Free standard shipping over $500; standard $19, express $39
- Press `/` anywhere to open search
- Sign in from the account icon (any name and email) to see past demo orders

Cart, orders, reviews, lesson progress and saved checkout details persist in `localStorage`
under the `Gajju:` prefix. Clear site data to reset.

## Structure

```
src/
  index.html  shop.html  product.html  cart.html  checkout.html
  css/
    global.css        tokens, type, buttons, forms, loader, cursor
    navigation.css    header, mobile menu, drawers, search, toasts, footer
    home.css          landing page sections
    products.css      shop, compare table, product detail
    commerce.css      cart page, checkout, confirmation
    animations.css    keyframes, reveal defaults, reduced motion
    responsive.css    breakpoints at 1180 / 960 / 640 px
  js/
    main.js           shared bootstrap for every page
    layout.js         header, drawers, footer markup
    navigation.js     panels, active indicator, search, account, newsletter
    animations.js     Lenis, loader, page transitions, cursor, text reveals
    stage.js          Three.js renderer setup, auto-pausing render loop, WebGL fallback, snapshots
    robot-model.js    procedural ARU-1 and RBK-2 models, explode/highlight helpers, GLB loader
    three-scene.js    hero scene
    robot-explorer.js 3D explorer
    assembly.js       step-by-step build
    products.js       product viewers, galleries, home showcase
    product-images.js studio "photos" rendered from the 3D models
    learn.js          lessons and lesson dialog
    cart.js           cart state, totals, promos
    cart-ui.js        drawer, cart lines, add-to-cart buttons
    summary.js        order summary + promo form (cart and checkout)
    home.js  shop.js  product-page.js  cart-page.js  checkout.js   page entries
    data.js           all product, component, review, lesson and step data
    storage.js  icons.js  toast.js  ui.js  component-icons.js
public/
  models/  images/    put real assets here
```

## Swapping in real 3D models

The robots are built from Three.js geometry so the prototype works with no assets.
Every viewer only depends on the `{ group, parts, animate }` shape returned by
`buildARU()` / `buildRover()` in `src/js/robot-model.js`.

To use a GLB:

1. Put the file in `public/models/`, e.g. `public/models/aru-1.glb`.
2. Name the nodes in your 3D tool after the part ids (`base`, `wheel-l`, `wheel-r`,
   `battery`, `torso`, `compute`, `arm-l`, `arm-r`, `head`, `lidar`).
3. Call `loadRobotGLB('/models/aru-1.glb', meta)` where `meta` maps each id to
   `{ name, desc, offset: [x, y, z] }` (offset is the exploded-view displacement), and use
   the result wherever `buildARU()` is called (explorer, hero, product viewers).

Real product photos can replace the rendered ones by returning image URLs from
`getProductImages()` in `src/js/product-images.js`.

## Performance and accessibility

- Each 3D canvas renders only while on screen and pauses in background tabs.
- Mobile: lower pixel ratio, no antialiasing, fewer particles, hero labels hidden.
- Scroll-to-zoom in 3D viewers only activates after you click into the viewer, so page scroll is never hijacked.
- `prefers-reduced-motion`: no smooth scroll, no loader sequence or page curtain, static robot, all content visible.
- Without WebGL, viewers show a static illustration instead of an empty canvas.
- Keyboard: focus styles everywhere, focus trapped in open panels, Escape closes them, arrow keys step through the explorer and assembly guide.

## Not included (by design)

No backend, accounts, real payments or emails. All orders are demo orders stored in the browser.
