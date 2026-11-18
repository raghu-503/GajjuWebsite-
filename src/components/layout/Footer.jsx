// Shared site footer (all routes). Content from the content document (v4), "Site-wide parts":
// links to live pages only, social links only when they exist, Privacy and Terms of use, the
// Neonflake line and the copyright line. Brand: the dark band (Ink, Paper text, Saffron accents).
//
// Nothing here is invented: links whose destination doesn't exist yet are shown as "Coming"
// and not linked. Fill in FOOTER_LINKS below as pages, policies and channels go live.
import { Link } from 'react-router-dom';
import Logo from '../Logo.jsx';
import { StatusLabel } from '../gajju/Labels.jsx';
import { FOOTER_NAV_LINKS, JOIN_LINK, SHOP_PAGES, joinHrefFor } from './NAV_LINKS.js';
import { useSite } from '../../context/SiteContext.jsx';

export const FOOTER_LINKS = {
  privacy: '/privacy', // not yet lawyer-approved; see the legal status note in content/policies.js
  terms: '/terms', // not yet lawyer-approved; see content/policies.js
  github: null, // repository URL
  // Show only the ones that exist: { label, href }
  social: [], // GitHub, YouTube, Instagram, LinkedIn, X, WhatsApp community
};

const POLICIES = [
  { key: 'privacy', label: 'Privacy' },
  { key: 'terms', label: 'Terms of use' },
];

export default function Footer() {
  const { page } = useSite();
  const shopping = SHOP_PAGES.includes(page);

  return (
    <footer className="gj-footer">
      <div className="gj-footer__inner">
        <div className="gj-footer__brand">
          <Link to="/" aria-label="Gajju, home" className="gj-footer__logo">
            <Logo variant="reverse" height={40} />
          </Link>
          <p>
            Gajju is made by Neonflake AI Labs Pvt Ltd, Hyderabad. Designs are open source; the software is free to
            download
            {FOOTER_LINKS.github ? (
              <>
                : <a href={FOOTER_LINKS.github}>GitHub</a>.
              </>
            ) : (
              '.'
            )}
          </p>
          <Link className="gj-btn gj-btn--primary" to={joinHrefFor(page)}>
            {JOIN_LINK.label}
          </Link>
        </div>

        <nav className="gj-footer__col" aria-label="Footer">
          <h2>On this site</h2>
          <ul>
            {FOOTER_NAV_LINKS.map((l) => (
              <li key={l.id}>
                <Link to={l.href}>{l.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="gj-footer__col">
          <h2>Policies</h2>
          <ul>
            {POLICIES.map((p) => (
              <li key={p.key}>
                {FOOTER_LINKS[p.key] ? (
                  <Link to={FOOTER_LINKS[p.key]}>{p.label}</Link>
                ) : (
                  <span className="gj-footer__unavailable">
                    {p.label} <StatusLabel tone="planned">Coming</StatusLabel>
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>

        {FOOTER_LINKS.social.length > 0 && (
          <div className="gj-footer__col">
            <h2>Follow the build</h2>
            <ul>
              {FOOTER_LINKS.social.map((s) => (
                <li key={s.href}>
                  <a href={s.href} target="_blank" rel="noopener noreferrer">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="gj-footer__bottom">
        <p>
          © 2026 Neonflake AI Labs Pvt Ltd. Gajju and the Gajju logo are trademarks of Neonflake AI Labs Pvt Ltd.
        </p>
        {shopping && <p>This shop is a prototype: no real orders are placed.</p>}
        <a href="#main">Back to top</a>
      </div>
    </footer>
  );
}
