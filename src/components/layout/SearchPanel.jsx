import { useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../Icon.jsx';
import { useSite } from '../../context/SiteContext.jsx';
import { PRODUCTS, KIT_COMPONENTS, LESSONS, formatPrice } from '../../js/data.js';

const INDEX = [
  ...PRODUCTS.map((p) => ({
    type: 'Product',
    title: p.name,
    text: `${p.description} ${p.features.join(' ')}`,
    href: `/product/${p.id}`,
    meta: formatPrice(p.price),
  })),
  ...KIT_COMPONENTS.map((c) => ({
    type: 'Kit part',
    title: c.name,
    text: c.desc,
    href: '/product/GAJJU-kit#components',
    meta: c.spec,
  })),
  ...LESSONS.map((l) => ({
    type: 'Lesson',
    title: l.title,
    text: l.summary,
    href: '/#learn',
    meta: `${l.mins} min`,
  })),
  {
    type: 'Page',
    title: '3D robot explorer',
    text: 'inspect components exploded view rotate zoom',
    href: '/#explore',
    meta: 'Interactive',
  },
  {
    type: 'Page',
    title: 'Assembly guide',
    text: 'step by step build torso electronics legs head trunk gripper',
    href: '/#assembly',
    meta: '7 steps',
  },
];

function Highlight({ text, q }) {
  const i = q ? text.toLowerCase().indexOf(q.toLowerCase()) : -1;
  if (i < 0) return text;
  return (
    <>
      {text.slice(0, i)}
      <mark>{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  );
}

export default function SearchPanel() {
  const { panel, closePanels, go } = useSite();
  const open = panel === 'search';
  const [q, setQ] = useState('');
  const query = q.trim().toLowerCase();
  const terms = query ? query.split(/\s+/) : [];
  const hits = query
    ? INDEX.filter((r) => terms.every((t) => `${r.title} ${r.text} ${r.type}`.toLowerCase().includes(t))).slice(0, 8)
    : [];
  const close = () => closePanels(true);

  return (
    <div className={`search${open ? ' is-open' : ''}`} data-panel="search" role="dialog" aria-modal="true" aria-label="Search" aria-hidden={!open}>
      <div className="search__box">
        <div className="search__field">
          <Icon name="search" />
          <input
            type="search"
            placeholder="Search robots, parts and lessons"
            aria-label="Search"
            autoComplete="off"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && hits[0]) {
                close();
                go(hits[0].href);
              }
            }}
          />
          <button className="icon-btn" data-close aria-label="Close search" onClick={() => closePanels()}>
            <Icon name="x" />
          </button>
        </div>
        <div className="search__results">
          {!query ? (
            <>
              <p className="search__hint">Try “servo”, “gripper”, “camera” or “battery”.</p>
              <div className="search__quick">
                {PRODUCTS.map((p) => (
                  <Link key={p.id} to={`/product/${p.id}`} onClick={close}>
                    {p.name}
                  </Link>
                ))}
                <Link to="/#explore" onClick={close}>
                  3D explorer
                </Link>
              </div>
            </>
          ) : hits.length ? (
            <ul>
              {hits.map((h) => (
                <li key={`${h.type}-${h.title}`}>
                  <Link to={h.href} className="search__hit" onClick={close}>
                    <span className="search__type">{h.type}</span>
                    <span className="search__title">
                      <Highlight text={h.title} q={terms[0]} />
                    </span>
                    <span className="search__meta">{h.meta}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="search__hint">
              Nothing matches “{q}”. Try a part name like “battery” or a topic like “motor control”.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
