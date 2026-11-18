// For parents (/parents). Content: content/parents.js (content document v4). Phase 2.
// Main button: Join the first-batch list (the shared sign-up form at the end of the page).
// No prices, reservations or payments; safety points are design goals; the privacy statement
// awaiting approval is not published.
import { useRef } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import { Section, SectionHead } from '../components/gajju/Section.jsx';
import { Pending, SHOW_PENDING, StatusLabel } from '../components/gajju/Labels.jsx';
import { PageHero, ActivityCards, IconList, JoinSection, ICON } from '../components/gajju/PageParts.jsx';
import HeroRobot from '../components/gajju/HeroRobot.jsx';
import Faq from '../components/gajju/Faq.jsx';
import { useReveals } from '../hooks/useReveals.js';
import { usePageMeta } from '../hooks/usePageMeta.js';
import { HERO, LEARNS, CHILDREN, HOME_HELP, KIT, PRIVACY, FAQ } from '../content/parents.js';

export default function Parents() {
  usePageMeta('/parents');
  const mainRef = useRef(null);
  useReveals(mainRef);

  return (
    <main id="main" className="gj" ref={mainRef}>
      <PageHero eyebrow={HERO.eyebrow} title={HERO.title} lead={HERO.lead} media={<HeroRobot label={HERO.mediaLabel} />}>
        <a className="gj-btn gj-btn--primary" href="#join">
          {HERO.primary}
        </a>
      </PageHero>

      <Section id="learns" tone="paper" labelledBy="gj-learns-title">
        <SectionHead id="gj-learns-title" title={LEARNS.title} />
        <ActivityCards items={LEARNS.items} columns={2} />
      </Section>

      <Section id="children" tone="cream" labelledBy="gj-children-title">
        <SectionHead id="gj-children-title" title={CHILDREN.title} />
        <IconList items={CHILDREN.items} />
        <p className="gj-note">
          <StatusLabel tone="planned">{CHILDREN.status}</StatusLabel>
          <span className="gj-caption">{CHILDREN.note}</span>
        </p>
      </Section>

      <Section id="home-help" tone="paper" labelledBy="gj-homehelp-title">
        <SectionHead id="gj-homehelp-title" title={HOME_HELP.title} lead={HOME_HELP.text} />
        <ActivityCards items={HOME_HELP.items} />
        <p className="gj-note">
          <StatusLabel tone="planned">{HOME_HELP.status}</StatusLabel>
          <span className="gj-caption">{HOME_HELP.note}</span>
        </p>
      </Section>

      <Section id="kit-or-ready-made" tone="cream" labelledBy="gj-pkit-title">
        <SectionHead id="gj-pkit-title" title={KIT.title} lead={KIT.lead} />
        <div className="gj-grid gj-grid--2">
          {KIT.options.map((opt) => (
            <div className="gj-card gj-option" key={opt.name} data-reveal>
              <h3 className="gj-h3">{opt.name}</h3>
              <ul className="gj-schools__list gj-schools__list--ink">
                {opt.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="gj-caption gj-after">{KIT.note}</p>
      </Section>

      <Section id="privacy" tone="paper" labelledBy="gj-pprivacy-title">
        <SectionHead id="gj-pprivacy-title" title={PRIVACY.title} lead={PRIVACY.text}>
          <p className="gj-after">
            <Link className="gj-link" to="/privacy">
              {PRIVACY.link}
              <Icon name="arrow-right" {...ICON} />
            </Link>
          </p>
          {SHOW_PENDING && (
            <p className="gj-after">
              <Pending note="proposed, waiting on Ayyappa's decision">{PRIVACY.proposed}</Pending>
            </p>
          )}
        </SectionHead>
      </Section>

      <Section id="faq" tone="cream" labelledBy="gj-pfaq-title">
        <div className="gj-schools__faq">
          <h2 className="gj-h2 gj-faq-title" id="gj-pfaq-title">
            Questions
          </h2>
          <Faq items={FAQ} />
        </div>
      </Section>

      <JoinSection tone="paper" />
    </main>
  );
}
