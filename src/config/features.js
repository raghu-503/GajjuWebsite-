// Feature switches, set at build time (Vite env variables; see .env files or the build command).
//
// SHOP_ENABLED: the prototype shop (/shop, /product/*, /cart, /checkout and the cart, search and
// account panels) is Phase 4 in the content document ("Shop … Phase 4"; "No price anywhere
// until the Reserve page opens"). It is OFF by default: those routes redirect to Home and the
// shop's page code is left out of the build. All shop source code is kept for Phase 4.
// Turn it on for development or testing with VITE_ENABLE_SHOP=true (npm run test:shop).
export const SHOP_ENABLED = import.meta.env.VITE_ENABLE_SHOP === 'true';

// PHASE2_ENABLED: the Phase 2 pages, For schools (/schools) and For parents (/parents). Hidden
// from the public site for now: OFF by default, so their header and footer links are not shown,
// both addresses redirect to Home, they are left out of the sitemap and blocked in robots.txt,
// and their page code is left out of the build. All Phase 2 source code (pages, content, the
// schools enquiry form) is kept. Turn it on with VITE_ENABLE_PHASE2=true (npm run test:phase2).
export const PHASE2_ENABLED = import.meta.env.VITE_ENABLE_PHASE2 === 'true';
