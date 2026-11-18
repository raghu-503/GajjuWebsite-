// Shared site header (all routes). Gajju brand: interim wordmark, Paper bar, Ink text, one Saffron
// call to action. Light only, so there is no theme switch (brand guidelines). The shop's search,
// account and cart controls appear only on the shop routes (see NAV_LINKS.js).
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Logo from '../Logo.jsx';
import Icon from '../Icon.jsx';
import { NAV_LINKS, JOIN_LINK, SHOP_LINK, SHOP_PAGES, joinHrefFor } from './NAV_LINKS.js';
import { useSite } from '../../context/SiteContext.jsx';
import { useCart } from '../../hooks/useCart.js';
import { gsap, reduced } from '../../js/animations.js';

const ICON = { strokeWidth: 1.5 };

/** Links shown for a page: the shop link is added on the shop routes only. */
export const navLinksFor = (page) => (SHOP_PAGES.includes(page) ? [...NAV_LINKS, SHOP_LINK] : NAV_LINKS);

/** aria-current: "page" for a page link, "location" for a section of the current page. */
export const currentFor = (link, active) =>
  active === link.id ? (link.href.includes('#') ? 'location' : 'page') : undefined;

/**
 * Which nav link is active. The menu links to pages, so it is the current page's link ("Shop"
 * on all the shop routes); on Home, which isn't in the menu, none is.
 */
export function useActiveSection(page) {
  if (SHOP_PAGES.includes(page)) return 'shop';
  return NAV_LINKS.some((l) => l.id === page) ? page : null;
}

export default function Header({ active }) {
  const { page, panel, openPanel, closePanels } = useSite();
  const shopping = SHOP_PAGES.includes(page);
  const links = navLinksFor(page);
  const menuOpen = panel === 'menu';
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`gj-header${scrolled ? ' is-scrolled' : ''}${menuOpen ? ' is-menu' : ''}`} data-nav>
      <div className="gj-header__inner">
        <Link className="gj-header__brand" to="/" aria-label="Gajju, home">
          <Logo height={34} />
        </Link>

        <nav className="gj-header__nav" aria-label="Primary">
          <ul>
            {links.map((l) => (
              <li key={l.id}>
                <Link
                  className={`gj-header__link${active === l.id ? ' is-active' : ''}`}
                  to={l.href}
                  aria-current={currentFor(l, active)}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="gj-header__actions">
          {shopping && <ShopControls openPanel={openPanel} />}
          <Link className="gj-btn gj-btn--primary gj-header__cta" to={joinHrefFor(page)}>
            {JOIN_LINK.label}
          </Link>
          <button
            className="gj-icon-btn gj-header__burger"
            type="button"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="gj-mobile-menu"
            onClick={(e) => {
              if (menuOpen) return closePanels();
              // Some browsers (Safari) don't focus a clicked button; focus it so closing the menu
              // returns focus here.
              e.currentTarget.focus({ preventScroll: true });
              openPanel('menu');
            }}
          >
            <Icon name={menuOpen ? 'x' : 'menu'} {...ICON} />
          </button>
        </div>
      </div>
    </header>
  );
}

/** Search, account and cart: the existing shop panels, unchanged. */
function ShopControls({ openPanel }) {
  const { totals } = useCart();
  const badgeRef = useRef(null);

  // Bounce the cart badge when something is added.
  useEffect(() => {
    const bump = () =>
      badgeRef.current &&
      !reduced &&
      gsap.fromTo(badgeRef.current, { scale: 1.5 }, { scale: 1, duration: 0.5, ease: 'elastic.out(1, 0.4)' });
    window.addEventListener('cart:added', bump);
    return () => window.removeEventListener('cart:added', bump);
  }, []);

  return (
    <>
      <button className="gj-icon-btn" type="button" aria-label="Search the shop" onClick={() => openPanel('search')}>
        <Icon name="search" {...ICON} />
      </button>
      <button className="gj-icon-btn gj-header__account" type="button" aria-label="Account" onClick={() => openPanel('account')}>
        <Icon name="user" {...ICON} />
      </button>
      <button
        className="gj-icon-btn gj-header__cart"
        type="button"
        aria-label={`Cart, ${totals.count} ${totals.count === 1 ? 'item' : 'items'}`}
        onClick={() => openPanel('cart')}
      >
        <Icon name="shopping-bag" {...ICON} />
        <span className={`cart-count${totals.count === 0 ? ' is-empty' : ''}`} ref={badgeRef} aria-hidden="true">
          {totals.count}
        </span>
      </button>
    </>
  );
}
