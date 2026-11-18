// Sets the page title, description and link-preview (Open Graph) tags for a Phase 1 page.
// Text: content/seo.js. Canonical link, og:url and og:image need the production domain
// (VITE_SITE_URL); until it is confirmed they are left out rather than guessed.
import { useEffect } from 'react';
import { PAGES, SITE_NAME, SHARE_IMAGE } from '../content/seo.js';

const SITE_URL = (() => {
  try {
    const u = new URL(import.meta.env.VITE_SITE_URL || '');
    return u.origin + u.pathname.replace(/\/+$/, '');
  } catch {
    return null;
  }
})();

function setMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (content == null) return el?.remove();
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(href) {
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!href) return el?.remove();
  if (!el) {
    el = document.createElement('link');
    el.rel = 'canonical';
    document.head.appendChild(el);
  }
  el.href = href;
}

/** @param {keyof typeof PAGES} path the page's own path, e.g. '/about' */
export function usePageMeta(path) {
  useEffect(() => {
    const page = PAGES[path];
    if (!page) return;
    const url = SITE_URL ? SITE_URL + (path === '/' ? '/' : path) : null;
    document.title = page.title;
    setMeta('name', 'description', page.description);
    setMeta('property', 'og:site_name', SITE_NAME);
    setMeta('property', 'og:type', 'website');
    setMeta('property', 'og:title', page.title);
    setMeta('property', 'og:description', page.description);
    setMeta('property', 'og:url', url);
    setMeta('property', 'og:image', SITE_URL ? SITE_URL + SHARE_IMAGE : null);
    setCanonical(url);
  }, [path]);
}
