import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Logo from '../Logo.jsx';
import Icon from '../Icon.jsx';
import { NAV_LINKS } from './NAV_LINKS.js';
import { useSite } from '../../context/SiteContext.jsx';
import { useCart } from '../../hooks/useCart.js';
import { gsap } from '../../js/animations.js';
import { getTheme, setTheme, onThemeChange } from '../../js/theme.js';

function ThemeToggle() {
  const [theme, setThemeState] = useState(getTheme);
  useEffect(() => onThemeChange(setThemeState), []);
  const next = theme === 'dark' ? 'light' : 'dark';
  return (
    <button
      className="icon-btn theme-toggle"
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
      onClick={() => setTheme(next)}
    >
      <Icon name="moon" className="theme-toggle__moon" />
      <Icon name="sun" className="theme-toggle__sun" />
    </button>
  );
}

/** Which nav link is active: scroll position on the home page, otherwise "Products". */
export function useActiveSection(page) {
  const [active, setActive] = useState(page === 'home' ? 'home' : 'products');
  useEffect(() => {
    if (page !== 'home') {
      setActive('products');
      return;
    }
    const sections = [...document.querySelectorAll('[data-nav-section]')];
    const update = () => {
      const mid = window.innerHeight * 0.4;
      for (const s of sections) {
        const r = s.getBoundingClientRect();
        if (r.top <= mid && r.bottom > mid) {
          setActive(s.dataset.navSection);
          break;
        }
      }
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, [page]);
  return active;
}

export default function Header({ active }) {
  const { panel, openPanel, closePanels } = useSite();
  const { totals } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const navRef = useRef(null);
  const indRef = useRef(null);
  const badgeRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Slide the indicator under the active link.
  useLayoutEffect(() => {
    const move = () => {
      const link = navRef.current?.querySelector(`[data-nav-link="${active}"]`);
      const ind = indRef.current;
      if (!link || !ind) return;
      ind.style.opacity = '1';
      ind.style.transform = `translateX(${link.offsetLeft}px)`;
      ind.style.width = `${link.offsetWidth}px`;
    };
    const raf = requestAnimationFrame(move);
    window.addEventListener('resize', move);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', move);
    };
  }, [active]);

  // Bounce the cart badge when something is added.
  useEffect(() => {
    const bump = () =>
      badgeRef.current &&
      gsap.fromTo(badgeRef.current, { scale: 1.6 }, { scale: 1, duration: 0.5, ease: 'elastic.out(1, 0.4)' });
    window.addEventListener('cart:added', bump);
    return () => window.removeEventListener('cart:added', bump);
  }, []);

  return (
    <header className={`nav${scrolled ? ' is-scrolled' : ''}${panel === 'menu' ? ' is-menu' : ''}`} data-nav>
      <Link className="nav__brand" to="/" aria-label="Gajju home">
        <Logo />
        <span className="nav__wordmark">Gajju</span>
      </Link>
      <nav className="nav__links" aria-label="Primary" ref={navRef}>
        {NAV_LINKS.map((l) => (
          <Link
            key={l.id}
            className={`nav__link${active === l.id ? ' is-active' : ''}`}
            data-nav-link={l.id}
            to={l.href}
            aria-current={active === l.id ? 'page' : undefined}
          >
            {l.label}
          </Link>
        ))}
        <span className="nav__indicator" aria-hidden="true" ref={indRef} />
      </nav>
      <div className="nav__actions">
        <ThemeToggle />
        <button className="icon-btn" aria-label="Search" onClick={() => openPanel('search')}>
          <Icon name="search" />
        </button>
        <button className="icon-btn" aria-label="Account" onClick={() => openPanel('account')}>
          <Icon name="user" />
        </button>
        <button className="icon-btn icon-btn--cart" aria-label="Cart" onClick={() => openPanel('cart')}>
          <Icon name="shopping-bag" />
          <span className={`cart-count${totals.count === 0 ? ' is-empty' : ''}`} ref={badgeRef}>
            {totals.count}
          </span>
        </button>
        <button
          className="icon-btn nav__burger"
          aria-label="Open menu"
          aria-expanded={panel === 'menu'}
          onClick={() => (panel === 'menu' ? closePanels() : openPanel('menu'))}
        >
          <Icon name="menu" />
        </button>
      </div>
    </header>
  );
}
