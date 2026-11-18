// About page (/about). Content: content/about.js (content document v4). Company information is
// limited to what the document gives; no team, awards or partners are named.
import { useRef } from 'react';
import Icon from '../components/Icon.jsx';
import { Section, SectionHead } from '../components/gajju/Section.jsx';
import { Pending, SHOW_PENDING, StatusLabel } from '../components/gajju/Labels.jsx';
import { PageHero, JoinSection, ICON } from '../components/gajju/PageParts.jsx';
import { useReveals } from '../hooks/useReveals.js';
import { usePageMeta } from '../hooks/usePageMeta.js';
import { HERO, STORY, VALUES, LEARNING, NEONFLAKE, NEONFLAKE_URL, CONTACT, PRESS } from '../content/about.js';

function ExternalLink({ href, children, className }) {
  return (
    <a className={className} href={href} target="_blank" rel="noopener noreferrer">
      {children}
      <Icon name="arrow-up-right" {...ICON} />
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

export default function About() {
  usePageMeta('/about');
  const showPress = PRESS.available || SHOW_PENDING; // set PRESS.available once the files exist
  const mainRef = useRef(null);
  useReveals(mainRef);

  return (
    <main id="main" className="gj" ref={mainRef}>
      <PageHero eyebrow={HERO.eyebrow} title={HERO.title} lead={HERO.lead}>
        <a className="gj-btn gj-btn--primary" href="#contact">
          {HERO.primary}
        </a>
        <ExternalLink className="gj-btn gj-btn--secondary" href={NEONFLAKE_URL}>
          {HERO.secondary}
        </ExternalLink>
      </PageHero>

      <Section id="story" tone="paper" labelledBy="gj-story-title">
        <div className="gj-story">
          <SectionHead id="gj-story-title" title={STORY.title} />
          <div className="gj-story__text" data-reveal>
            {STORY.paragraphs.map((p) => (
              <p key={p.slice(0, 24)}>{p}</p>
            ))}
          </div>
        </div>
      </Section>

      <Section id="vision" tone="cream" labelledBy="gj-vision-title">
        <SectionHead id="gj-vision-title" title={VALUES.title} />
        <ul className="gj-grid gj-grid--3">
          {VALUES.items.map((v) => (
            <li className="gj-card" key={v.name} data-reveal>
              <span className="gj-icon">
                <Icon name={v.icon} {...ICON} />
              </span>
              <h3 className="gj-h3">{v.name}</h3>
              <p>{v.text}</p>
            </li>
          ))}
        </ul>
      </Section>

      {/* The page's one dark band (brand guidelines): learning by building, and open design. */}
      <Section id="build-program-teach" tone="dark" labelledBy="gj-bpt-title">
        <SectionHead id="gj-bpt-title" eyebrow={LEARNING.eyebrow} title={LEARNING.title} />
        <ul className="gj-grid gj-grid--3">
          {LEARNING.items.map((item) => (
            <li className="gj-open__item" key={item.name} data-reveal>
              <span className="gj-icon">
                <Icon name={item.icon} {...ICON} />
              </span>
              <div>
                <h3>{item.name}</h3>
                <p>{item.text}</p>
              </div>
            </li>
          ))}
        </ul>
        <div className="gj-open__terms gj-open__terms--2" data-reveal>
          <div>
            <h3>Why the design is open</h3>
            <p>{LEARNING.open}</p>
          </div>
          <div>
            <h3>The software</h3>
            <p>{LEARNING.software}</p>
          </div>
        </div>
      </Section>

      <Section id="neonflake" tone="cream" labelledBy="gj-neonflake-title">
        <div className="gj-story">
          <SectionHead id="gj-neonflake-title" title={NEONFLAKE.title} />
          <div className="gj-story__text" data-reveal>
            <p>{NEONFLAKE.text}</p>
            <p>
              Learn more at{' '}
              <ExternalLink href={NEONFLAKE_URL} className="gj-link">
                neonflake.com
              </ExternalLink>
              .
            </p>
            <div className="gj-card gj-card--highlight gj-next">
              <h3 className="gj-h3">What&apos;s next</h3>
              <p>{NEONFLAKE.next}</p>
            </div>
          </div>
        </div>
      </Section>

      <Section id="contact" tone="paper" labelledBy="gj-contact-title">
        <SectionHead id="gj-contact-title" title={CONTACT.title} />
        {/* The press kit files are still to be supplied, so its card shows only in review mode. */}
        <div className={`gj-grid ${showPress ? 'gj-grid--3' : 'gj-grid--2'}`}>
          <div className="gj-card gj-contact" data-reveal>
            <h3 className="gj-h3">Email</h3>
            <dl>
              {/* The general address in the content document ("ello@…") is unconfirmed: it is
                  listed only once confirmed, or in review mode with a note. */}
              {(CONTACT.general.confirmed || SHOW_PENDING) && (
                <div>
                  <dt>General</dt>
                  <dd>
                    {CONTACT.general.confirmed ? (
                      <a className="gj-link" href={`mailto:${CONTACT.general.value}`}>
                        {CONTACT.general.value}
                      </a>
                    ) : (
                      <Pending note="address to be confirmed">{CONTACT.general.value}</Pending>
                    )}
                  </dd>
                </div>
              )}
              <div>
                <dt>Schools</dt>
                <dd>
                  <a className="gj-link" href={`mailto:${CONTACT.schools}`}>
                    {CONTACT.schools}
                  </a>
                </dd>
              </div>
              <div>
                <dt>Press</dt>
                <dd>
                  <a className="gj-link" href={`mailto:${CONTACT.press}`}>
                    {CONTACT.press}
                  </a>
                </dd>
              </div>
            </dl>
          </div>
          <div className="gj-card gj-contact" data-reveal>
            <h3 className="gj-h3">Address</h3>
            <address>
              {CONTACT.address.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </address>
          </div>
          {showPress && (
            <div className="gj-card gj-contact" data-reveal>
              <h3 className="gj-h3">{PRESS.title}</h3>
              <p>{PRESS.text}</p>
              <StatusLabel tone="awaiting">{PRESS.status}</StatusLabel>
            </div>
          )}
        </div>
      </Section>

      <JoinSection tone="cream" />
    </main>
  );
}
