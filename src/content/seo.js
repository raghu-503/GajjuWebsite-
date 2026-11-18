// Page titles and descriptions for search engines and link previews. Plain data (no browser or
// Vite APIs) so vite.config.js can also use it to write robots.txt and sitemap.xml.
// Descriptions use the content document's own lines for each page.
//
// The production domain is not confirmed yet. Everything that needs a full address (canonical
// links, og:url, og:image, sitemap.xml and the Sitemap line in robots.txt) is produced only when
// the build sets VITE_SITE_URL, e.g. VITE_SITE_URL=https://example.org (no trailing slash).

export const SITE_NAME = 'Gajju';

/** The public pages (Phase 1 plus the Phase 2 schools and parents pages): the only pages listed in sitemap.xml. */
export const PAGES = {
  '/': {
    title: 'Gajju · Physical AI you can build',
    description:
      'Meet Gajju Mini, a baby elephant robot that walks on four legs, sees, hears, talks and picks things up with its trunk. Physical AI you can build.',
  },
  '/gajju-mini': {
    title: 'Gajju Mini · Gajju',
    description:
      'A baby elephant robot that walks on four legs, sees, hears, talks and picks things up with its trunk, that you can hold, open up and teach.',
  },
  '/build-log': {
    title: 'Build log · Gajju',
    description:
      'Building Gajju Mini, week by week: what worked, what broke and what we changed. No polish, just the real build.',
  },
  '/schools': {
    title: 'For schools and labs · Gajju',
    description:
      'A Physical AI lab that fits on a desk. With one robot, students learn mechanics, electronics, coding and AI by building and teaching Gajju Mini.',
  },
  '/parents': {
    title: 'For parents · Gajju',
    description:
      'What your child learns by building Gajju Mini, a baby elephant robot: how machines work, how to make things move, how AI learns and how to fix things.',
  },
  '/about': {
    title: 'About · Gajju',
    description: 'We build robots people can understand. Gajju is made by Neonflake AI Labs Pvt Ltd in Hyderabad.',
  },
  '/founding': {
    title: 'Founding teachers and makers · Gajju',
    description:
      'Apply to build the first Gajjus with us: for teachers and makers who will build it first, use it with students and tell us honestly what to fix.',
  },
  '/privacy': {
    title: 'Privacy Policy · Gajju',
    description: 'What the forms on the Gajju website ask for, and why.',
  },
  '/terms': {
    title: 'Terms of Use · Gajju',
    description: 'The terms for this website and the Gajju files shared from it.',
  },
};

/**
 * Phase 2 paths: hidden for now (VITE_ENABLE_PHASE2, config/features.js). While hidden they are
 * left out of sitemap.xml and blocked in robots.txt (vite.config.js); their PAGES entries stay
 * for when Phase 2 is switched on.
 */
export const PHASE2_PATHS = ['/schools', '/parents'];

/** Paths listed in sitemap.xml. */
export const sitemapPaths = ({ phase2 = false } = {}) =>
  Object.keys(PAGES).filter((p) => phase2 || !PHASE2_PATHS.includes(p));

/** Shared picture for link previews (needs VITE_SITE_URL, since og:image must be a full URL). */
export const SHARE_IMAGE = '/media/DOC-website-hero-poster-v2.jpg';

/** Phase 4 shop paths: kept out of search while the shop is off (config/features.js). */
export const SHOP_PATHS = ['/shop', '/product/', '/cart', '/checkout'];
