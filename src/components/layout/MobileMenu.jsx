import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { NAV_LINKS } from './NAV_LINKS.js';
import { useSite } from '../../context/SiteContext.jsx';
import { gsap } from '../../js/animations.js';

export default function MobileMenu({ active }) {
  const { panel, closePanels } = useSite();
  const open = panel === 'menu';
  const ref = useRef(null);

  // Stagger the links in each time the menu opens.
  useEffect(() => {
    if (!open) return;
    const tween = gsap.fromTo(
      ref.current.querySelectorAll('.mnav__link'),
      { y: 40, opacity: 0 },
      { y: 0, opacity: 1, stagger: 0.06, duration: 0.5, ease: 'power3.out' },
    );
    return () => tween.kill();
  }, [open]);

  const close = () => closePanels(true);
  return (
    <div className={`mnav${open ? ' is-open' : ''}`} data-panel="menu" aria-hidden={!open} ref={ref}>
      <nav className="mnav__links" aria-label="Mobile">
        {NAV_LINKS.map((l, i) => (
          <Link
            key={l.id}
            className={`mnav__link${active === l.id ? ' is-active' : ''}`}
            data-nav-link={l.id}
            to={l.href}
            style={{ '--i': i }}
            aria-current={active === l.id ? 'page' : undefined}
            onClick={close}
          >
            {l.label}
          </Link>
        ))}
      </nav>
      <div className="mnav__foot">
        <Link className="btn btn--ghost" to="/shop" onClick={close}>
          Shop robots
        </Link>
        <Link className="btn btn--primary" to="/product/GAJJU-kit" onClick={close}>
          Build your own
        </Link>
      </div>
    </div>
  );
}
