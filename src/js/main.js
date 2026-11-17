// Shared bootstrap for every page.
import '../css/tailwind.css'; // first: declares the cascade layer order
import '../css/global.css';
import '../css/navigation.css';
import '../css/animations.css';
import '../css/home.css';
import '../css/products.css';
import '../css/commerce.css';
import '../css/responsive.css';

import { renderLayout } from './layout.js';
import { initTheme } from './theme.js';
import { refreshIcons } from './icons.js';
import { initNavigation, setScrollLock } from './navigation.js';
import { initCartUI } from './cart-ui.js';
import { initLenis, initTransitions, initCursor, runLoader, initReveals, scrollToTarget, ScrollTrigger } from './animations.js';

export function initSite(page) {
  document.documentElement.classList.add('has-js');
  renderLayout(page);
  initTheme();
  const lenis = initLenis();
  setScrollLock({
    stop: () => (lenis ? lenis.stop() : (document.body.style.overflow = 'hidden')),
    start: () => (lenis ? lenis.start() : (document.body.style.overflow = '')),
  });
  initNavigation(page);
  initCartUI();
  initCursor();
  initTransitions(lenis, page);
  refreshIcons();

  const ready = runLoader(page).then(() => {
    if (location.hash && document.querySelector(location.hash)) {
      setTimeout(() => scrollToTarget(lenis, location.hash), 50);
    }
    ScrollTrigger.refresh();
  });

  return {
    lenis,
    ready,
    /** Call after a page renders its dynamic markup. */
    hydrate() {
      refreshIcons();
      initReveals();
    },
  };
}
