# Gajju — Robotics website prototype

A complete frontend prototype for a robotics brand: cinematic landing page, interactive 3D
robots, DIY kit exploration, shop, product pages, cart and checkout. A React 18 single-page app
(React Router) with Three.js, GSAP + ScrollTrigger, Lenis and Lucide, built with Vite.

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

It is a single-page app: the host must serve `index.html` for unknown paths (an "SPA fallback",
e.g. Netlify `_redirects`, Vercel rewrites). `vite` and `vite preview` already do this.
Old URLs such as `product.html?id=GAJJU` redirect to the new routes.
Fonts load from Google Fonts (Archivo); offline, the site falls back to system fonts.

## Pages

| Page                                  | What it does                                                                                                                      |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `/`                                   | Hero with 3D robot, brand intro, capabilities, product showcase, 3D explorer, 7-step assembly, learning centre, about and contact |
| `/shop`                               | Category tabs, filter, sort, image galleries, quantity, add to cart, comparison table             |
| `/product/GAJJU` / `/product/GAJJU-kit` | 3D viewer with zoom, gallery, specs, included items, kit component breakdown, reviews (you can post one), related product         |
| `/cart`                               | Quantities, remove, clear, promo codes, shipping progress                                                                         |
| `/checkout`                           | Validated form, shipping method, demo card / UPI / bank transfer, order confirmation (`?order=GJ-…` reopens it)                   |

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
  index.html          single HTML shell (#root) + no-flash theme script
  main.jsx            entry: global CSS, BrowserRouter
  App.jsx             routes (+ redirects from the old *.html URLs)
  pages/              Home, Shop, Product, Cart, Checkout
  components/
    Layout.jsx        app shell: loader, curtain transitions, Lenis, panels, keyboard, toasts
    layout/           Header, MobileMenu, CartDrawer, SearchPanel, AccountPanel, Toasts, Footer
    home/             Explorer, Assembly, Lessons (3D + UI sections of the home page)
    ProductCard, CartLine, OrderSummary, SplitText, Stars, Icon, Logo, ComponentIcon
  context/            SiteContext (lenis, loaded, open panel, go(to))
  hooks/              useCart, useProductImages, useReveals, useAddToCart, useWhenNear, …
  css/                unchanged stylesheets (tokens, layout, pages, animations, breakpoints)
  js/                 framework-free modules used by the components:
    data.js  cart.js  storage.js  theme.js  toast.js  animations.js
    stage.js  gajju-model.js  robot-model.js  product-images.js
    three-scene.js    hero scene            (initHeroScene → { playIntro, destroy })
    robot-explorer.js 3D explorer controller (createExplorer → { selectGroup, …, destroy })
    assembly.js       build-guide controller (createAssembly → { goTo, destroy })
    gajju-viewer.js   product 3D viewer      (createGajjuViewer → { …, destroy })
public/
  models/             gajju2_robot.glb
```

The Three.js modules stay imperative; React components mount them in effects and call
`destroy()` on unmount, so navigating between routes releases every WebGL context,
ScrollTrigger and listener.

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
