// App shell shared by every route: loader, curtain, cursor, header, panels, toasts and footer.
// Also owns smooth scrolling (Lenis), page transitions and the panel/keyboard behaviour.
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Logo from './Logo.jsx';
import Header, { useActiveSection } from './layout/Header.jsx';
import MobileMenu from './layout/MobileMenu.jsx';
import CartDrawer from './layout/CartDrawer.jsx';
import SearchPanel from './layout/SearchPanel.jsx';
import AccountPanel from './layout/AccountPanel.jsx';
import Toasts from './layout/Toasts.jsx';
import Footer from './layout/Footer.jsx';
import { SiteContext } from '../context/SiteContext.jsx';
import { initTheme } from '../js/theme.js';
import { getProduct } from '../js/data.js';
import { toast } from '../js/toast.js';
import {
  gsap,
  ScrollTrigger,
  reduced,
  createLenis,
  runLoader,
  initCursor,
  cursorEnabled,
  scrollToTarget,
  scrollToTop,
} from '../js/animations.js';

const pageOf = (pathname) => (pathname === '/' ? 'home' : pathname.split('/')[1] || 'home');

const session = {
  get(k) {
    try {
      return sessionStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set(k, v) {
    try {
      sessionStorage.setItem(k, v);
    } catch {
      /* ignore */
    }
  },
};

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const page = pageOf(location.pathname);
  const active = useActiveSection(page);

  const loaderRef = useRef(null);
  const curtainRef = useRef(null);
  const cursorRef = useRef(null);
  const [showCursor] = useState(cursorEnabled);

  /* ---------- Smooth scroll ---------- */
  const lenisRef = useRef(null);
  const [lenis, setLenis] = useState(null);
  useEffect(() => {
    initTheme();
    const s = createLenis();
    lenisRef.current = s.lenis;
    setLenis(s.lenis);
    return () => {
      lenisRef.current = null;
      s.destroy();
    };
  }, []);

  /* ---------- Loader (full sequence on the first home visit of a session) ---------- */
  const [loaded, setLoaded] = useState(false);
  const loaderStarted = useRef(false);
  useEffect(() => {
    if (loaderStarted.current) return;
    loaderStarted.current = true;
    const full = page === 'home' && !session.get('nx-loaded') && !reduced;
    session.set('nx-loaded', '1');
    runLoader(loaderRef.current, { full }).then(() => {
      setLoaded(true);
      if (window.location.hash) setTimeout(() => scrollToTarget(lenisRef.current, window.location.hash), 50);
      ScrollTrigger.refresh();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- Cursor ---------- */
  useEffect(() => {
    if (showCursor && cursorRef.current) return initCursor(cursorRef.current);
  }, [showCursor]);

  /* ---------- Panels ---------- */
  const [panel, setPanel] = useState(null);
  const panelRef = useRef(null);
  const lastFocus = useRef(null);
  const openPanel = useCallback((name) => {
    if (panelRef.current === name) return;
    if (!panelRef.current) lastFocus.current = document.activeElement;
    panelRef.current = name;
    setPanel(name);
  }, []);
  const closePanels = useCallback((silent = false) => {
    if (!panelRef.current) return;
    panelRef.current = null;
    setPanel(null);
    if (!silent) lastFocus.current?.focus?.({ preventScroll: true });
  }, []);

  // Scroll lock, html class and initial focus for the open panel.
  useEffect(() => {
    document.documentElement.classList.toggle('has-panel', !!panel);
    if (!panel) {
      if (lenis) lenis.start();
      else document.body.style.overflow = '';
      return;
    }
    if (lenis) lenis.stop();
    else document.body.style.overflow = 'hidden';
    const id = setTimeout(() => {
      const el = document.querySelector(`[data-panel="${panel}"]`);
      const f = el?.querySelector('input, button:not([data-close]), a[href]') || el?.querySelector('button');
      f?.focus({ preventScroll: true });
    }, 60);
    return () => clearTimeout(id);
  }, [panel, lenis]);

  // Escape closes, "/" opens search, Tab stays inside the open panel.
  useEffect(() => {
    const onKey = (e) => {
      const open = panelRef.current;
      if (e.key === 'Escape') closePanels();
      if (e.key === '/' && !open && !/input|textarea|select/i.test(document.activeElement?.tagName || '')) {
        e.preventDefault();
        openPanel('search');
      }
      if (e.key === 'Tab' && open) {
        const el = document.querySelector(`[data-panel="${open}"]`);
        const f = [...el.querySelectorAll('a[href], button, input, select, textarea')].filter((x) => x.offsetParent);
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) {
          e.preventDefault();
          f.at(-1).focus();
        } else if (!e.shiftKey && document.activeElement === f.at(-1)) {
          e.preventDefault();
          f[0].focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [openPanel, closePanels]);

  /* ---------- Cart toasts ---------- */
  useEffect(() => {
    const onAdded = (e) => toast(`${getProduct(e.detail.id).name} added to cart`);
    window.addEventListener('cart:added', onAdded);
    return () => window.removeEventListener('cart:added', onAdded);
  }, []);

  /* ---------- Navigation with the page curtain ---------- */
  const pending = useRef(null); // 'curtain' | 'inPage' for the navigation in flight
  const go = useCallback(
    (to) => {
      const url = new URL(to, window.location.href);
      const path = url.pathname + url.search + url.hash;
      const here = window.location;
      if (url.pathname === here.pathname && url.search === here.search) {
        // Same page: scroll to the anchor (or the top) instead of reloading.
        pending.current = 'inPage';
        navigate(path, { replace: true });
        return;
      }
      if (reduced) {
        navigate(path);
        return;
      }
      if (pending.current === 'curtain') return; // a transition is already running
      pending.current = 'curtain';
      gsap.set(curtainRef.current, { transformOrigin: 'bottom' });
      gsap.to(curtainRef.current, {
        scaleY: 1,
        duration: 0.5,
        ease: 'power4.inOut',
        onComplete: () => navigate(path),
      });
    },
    [navigate],
  );

  // Route every internal link through go(). Capture phase, so <Link> sees defaultPrevented.
  useEffect(() => {
    const onClick = (e) => {
      const a = e.target.closest?.('a[href]');
      if (
        !a ||
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey ||
        (a.target && a.target !== '_self') ||
        a.hasAttribute('download')
      )
        return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      e.preventDefault();
      go(url.pathname + url.search + url.hash);
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [go]);

  // After each navigation: reset scroll, reveal the new page, honour #hash.
  const firstLocation = useRef(true);
  useLayoutEffect(() => {
    document.body.dataset.page = page;
    if (firstLocation.current) {
      firstLocation.current = false; // the loader handles the first page
      return;
    }
    const kind = pending.current;
    pending.current = null;
    const lenisNow = lenisRef.current;
    if (kind === 'inPage') {
      if (location.hash) scrollToTarget(lenisNow, location.hash);
      else scrollToTop(lenisNow);
      return;
    }
    closePanels(true);
    scrollToTop(lenisNow, true);
    if (kind === 'curtain') {
      gsap.set(curtainRef.current, { scaleY: 1, transformOrigin: 'top' });
      gsap.to(curtainRef.current, { scaleY: 0, duration: 0.7, ease: 'power4.inOut', delay: 0.1 });
    }
    const hash = location.hash;
    const id = setTimeout(() => {
      ScrollTrigger.refresh();
      if (hash) scrollToTarget(lenisRef.current, hash);
    }, 80);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  const site = useMemo(
    () => ({ lenis, loaded, panel, openPanel, closePanels, go, page }),
    [lenis, loaded, panel, openPanel, closePanels, go, page],
  );

  return (
    <SiteContext.Provider value={site}>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <div className="loader" aria-hidden="true" ref={loaderRef}>
        <div className="loader__inner">
          <Logo />
          <div className="loader__bar">
            <span data-loader-bar />
          </div>
          <p className="loader__label" data-loader-label>
            Initialising systems
          </p>
        </div>
      </div>
      <div className="curtain" aria-hidden="true" ref={curtainRef} />
      {showCursor && (
        <div className="cursor" aria-hidden="true" ref={cursorRef}>
          <span className="cursor__dot" />
          <span className="cursor__ring" />
        </div>
      )}

      <Header active={active} />
      <MobileMenu active={active} />
      <div className={`scrim${panel && panel !== 'menu' ? ' is-open' : ''}`} onClick={() => closePanels()} />
      <CartDrawer />
      <SearchPanel />
      <AccountPanel />
      <Toasts />

      <Outlet />

      <Footer />
    </SiteContext.Provider>
  );
}
