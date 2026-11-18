// Site navigation: the content document's menu with the Phase 2 pages ("Gajju Mini · Build log ·
// For schools · For parents · About · button Join the first-batch list"). Add Open source here
// when that page goes live (Appendix A).
//
// The Phase 2 links (`phase2: true`) are shown only when PHASE2_ENABLED (config/features.js);
// while Phase 2 is hidden the menu is the Phase 1 one: Gajju Mini · Build log · About.
//
// `id` is the page name Layout derives from the URL (/gajju-mini → "gajju-mini"), for the
// active state.
import { PHASE2_ENABLED } from '../../config/features.js';

const ALL_NAV_LINKS = [
  { id: 'gajju-mini', label: 'Gajju Mini', href: '/gajju-mini' },
  { id: 'build-log', label: 'Build log', href: '/build-log' },
  { id: 'schools', label: 'For schools', href: '/schools', phase2: true },
  { id: 'parents', label: 'For parents', href: '/parents', phase2: true },
  { id: 'about', label: 'About', href: '/about' },
];
export const NAV_LINKS = ALL_NAV_LINKS.filter((l) => PHASE2_ENABLED || !l.phase2);

/** Footer order ("On this site"): Gajju Mini, For schools, For parents, Build log, About. */
const FOOTER_ORDER = ['gajju-mini', 'schools', 'parents', 'build-log', 'about'];
export const FOOTER_NAV_LINKS = FOOTER_ORDER.map((id) => NAV_LINKS.find((l) => l.id === id)).filter(Boolean);

/** Pages that end with the sign-up form (content document: "Every page ends with the same sign-up form"). */
const JOIN_PAGES = {
  home: '/',
  'gajju-mini': '/gajju-mini',
  'build-log': '/build-log',
  schools: '/schools',
  parents: '/parents',
  about: '/about',
};

/** The main call to action: the sign-up form on this page, or on Home from pages without one. */
export const JOIN_LINK = { label: 'Join the first-batch list', href: '/#join' };
export const joinHrefFor = (page) => `${JOIN_PAGES[page] ?? '/'}#join`;

/**
 * The prototype shop is not part of the approved site yet ("Shop … phase 4"; no prices until the
 * Reserve page opens), so its link, search, account and cart only appear on the shop routes.
 */
export const SHOP_PAGES = ['shop', 'product', 'cart', 'checkout'];
export const SHOP_LINK = { id: 'shop', label: 'Shop', href: '/shop' };
