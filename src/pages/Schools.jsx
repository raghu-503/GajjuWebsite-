// For schools and labs (/schools). Content: content/schools.js (content document v4). Phase 2.
// Main button: Book a call, which (like "Become a founding school") goes to the enquiry form on
// this page: there is no booking link yet. No prices, reservations or payments.
import { useRef } from 'react';
import Icon from '../components/Icon.jsx';
import { Section, SectionHead } from '../components/gajju/Section.jsx';
import { Pending, SHOW_PENDING, StatusLabel } from '../components/gajju/Labels.jsx';
import { PageHero, ActivityCards, LadderSteps, JoinSection, ICON } from '../components/gajju/PageParts.jsx';
import HeroVideo from '../components/gajju/HeroVideo.jsx';
import SchoolsForm from '../components/gajju/SchoolsForm.jsx';
import Faq from '../components/gajju/Faq.jsx';
import { useReveals } from '../hooks/useReveals.js';
import { usePageMeta } from '../hooks/usePageMeta.js';
import { WALK_LOOP } from '../content/media.js';
import { HERO, WHY, STAGES, PILOTS, FOUNDING, FAQ, ENQUIRY } from '../content/schools.js';

const ENQUIRY_HREF = '#enquiry';

export default function Schools() {
  usePageMeta('/schools');
  const mainRef = useRef(null);
  useReveals(mainRef);
  const faq = FAQ.filter((item) => !item.reviewOnly || SHOW_PENDING);

  return (
    <main id="main" className="gj" ref={mainRef}>
      <PageHero eyebrow={HERO.eyebrow} title={HERO.title} lead={HERO.lead} media={<HeroVideo video={WALK_LOOP} />}>
        <a className="gj-btn gj-btn--primary" href={ENQUIRY_HREF}>
          {HERO.primary}
        </a>
        <a className="gj-btn gj-btn--secondary" href={ENQUIRY_HREF}>
          {HERO.secondary}
        </a>
      </PageHero>

      <Section id="why" tone="paper" labelledBy="gj-why-title">
        <SectionHead id="gj-why-title" title={WHY.title} />
        <ActivityCards items={WHY.items.map((w) => ({ icon: w.icon, name: w.name, line: w.text }))} columns={2} />
      </Section>

      <Section id="stages" tone="cream" labelledBy="gj-stages-title">
        <SectionHead id="gj-stages-title" title={STAGES.title} />
        <LadderSteps steps={STAGES.steps} />
        <p className="gj-note">
          <StatusLabel tone="planned">{STAGES.status}</StatusLabel>
          <span className="gj-caption">{STAGES.note}</span>
        </p>
      </Section>

      {/* The page's one dark band (brand guidelines). */}
      <Section id="pilots" tone="dark" labelledBy="gj-pilots-title">
        <SectionHead id="gj-pilots-title" title={PILOTS.title}>
          <p className="gj-schools__status">
            <StatusLabel tone="planned">{PILOTS.status}</StatusLabel>
          </p>
          <p className="gj-lead">{PILOTS.text}</p>
        </SectionHead>
        <div className="gj-open__terms gj-open__terms--2" data-reveal>
          <div>
            <h3>{PILOTS.includesTitle}</h3>
            <ul className="gj-schools__list">
              {PILOTS.includes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3>Booking</h3>
            <p>{PILOTS.note}</p>
          </div>
        </div>
        <div className="gj-btns">
          <a className="gj-btn gj-btn--primary" href={ENQUIRY_HREF}>
            {HERO.primary}
          </a>
        </div>
      </Section>

      <Section id="founding-schools" tone="paper" labelledBy="gj-fschools-title">
        <div className="gj-founding">
          <div>
            <SectionHead id="gj-fschools-title" eyebrow={FOUNDING.eyebrow} title={FOUNDING.title} />
            <p data-reveal>{FOUNDING.text}</p>
            {SHOW_PENDING && (
              <p className="gj-after">
                <Pending note={FOUNDING.contact.note}>{FOUNDING.contact.pending}</Pending>
              </p>
            )}
          </div>
          <div className="gj-card gj-card--highlight gj-founding__cta" data-reveal>
            <StatusLabel tone="planned">{FOUNDING.status}</StatusLabel>
            <h3 className="gj-h3">{FOUNDING.plannedTitle}</h3>
            <ul className="gj-schools__list gj-schools__list--ink">
              {FOUNDING.planned.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <a className="gj-btn gj-btn--primary" href={ENQUIRY_HREF}>
              {FOUNDING.cta}
              <Icon name="arrow-right" {...ICON} />
            </a>
          </div>
        </div>
      </Section>

      <Section id="faq" tone="cream" labelledBy="gj-sfaq-title">
        <div className="gj-schools__faq">
          <h2 className="gj-h2 gj-faq-title" id="gj-sfaq-title">
            Questions
          </h2>
          <Faq items={faq} />
        </div>
      </Section>

      <Section id="enquiry" tone="paper" labelledBy="gj-enquiry-title">
        <div className="gj-join gj-join--single">
          <div className="gj-card">
            <SectionHead id="gj-enquiry-title" eyebrow="Book a call" title={ENQUIRY.title} lead={ENQUIRY.lead} />
            <SchoolsForm />
          </div>
        </div>
      </Section>

      {/* Content document: "End of page: the sign-up form." */}
      <JoinSection tone="cream" />
    </main>
  );
}
