// Mobile and tablet menu. It is a Layout panel ("menu"), so Layout handles the scroll lock,
// moving focus into it, keeping Tab inside it, Escape to close and returning focus to the menu
// button. When closed it is `hidden`, so its links are out of the tab order.
import { Link } from 'react-router-dom';
import { JOIN_LINK, joinHrefFor } from './NAV_LINKS.js';
import { navLinksFor, currentFor } from './Header.jsx';
import { useSite } from '../../context/SiteContext.jsx';

export default function MobileMenu({ active }) {
  const { page, panel, closePanels } = useSite();
  const open = panel === 'menu';
  const close = () => closePanels(true);

  return (
    <div id="gj-mobile-menu" className="gj-mnav" data-panel="menu" hidden={!open}>
      <nav aria-label="Menu">
        <ul className="gj-mnav__links">
          {navLinksFor(page).map((l) => (
            <li key={l.id}>
              <Link
                className={`gj-mnav__link${active === l.id ? ' is-active' : ''}`}
                to={l.href}
                aria-current={currentFor(l, active)}
                onClick={close}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <Link className="gj-btn gj-btn--primary gj-mnav__cta" to={joinHrefFor(page)} onClick={close}>
        {JOIN_LINK.label}
      </Link>
    </div>
  );
}
