// Founding teachers and makers (/founding): the application form the Home page "Apply" button
// opens (content document, Home section 9). Not in the main menu, as in the document's site map.
import { useRef } from 'react';
import { Section, SectionHead } from '../components/gajju/Section.jsx';
import { Pending, SHOW_PENDING, StatusLabel } from '../components/gajju/Labels.jsx';
import { PageHero, IconList } from '../components/gajju/PageParts.jsx';
import FoundingForm from '../components/gajju/FoundingForm.jsx';
import { useReveals } from '../hooks/useReveals.js';
import { usePageMeta } from '../hooks/usePageMeta.js';
import { FOUNDING_PAGE, WHAT_FOUNDERS_DO, OPEN_QUESTIONS } from '../content/founding.js';

export default function Founding() {
  usePageMeta('/founding');
  const mainRef = useRef(null);
  useReveals(mainRef);

  return (
    <main id="main" className="gj" ref={mainRef}>
      <PageHero
        eyebrow={FOUNDING_PAGE.eyebrow}
        title={FOUNDING_PAGE.title}
        lead={
          <>
            {FOUNDING_PAGE.textBefore} <Pending note={FOUNDING_PAGE.countNote}>{FOUNDING_PAGE.count}</Pending>{' '}
            {FOUNDING_PAGE.textAfter}
          </>
        }
      >
        <a className="gj-btn gj-btn--primary" href="#apply">
          Apply
        </a>
      </PageHero>

      <Section id="apply" tone="paper" labelledBy="gj-apply-title">
        <div className="gj-apply">
          <aside className="gj-apply__side" aria-label="About the programme">
            <div className="gj-card gj-card--highlight" data-reveal>
              <h2 className="gj-h3">What founding teachers and makers do</h2>
              <IconList items={WHAT_FOUNDERS_DO} className="gj-log__outline gj-apply__list" />
            </div>
            {SHOW_PENDING && (
              <div className="gj-card gj-apply__open" data-reveal>
                <StatusLabel tone="awaiting">To be confirmed</StatusLabel>
                <h2 className="gj-h3">Still to be decided</h2>
                <ul>
                  {OPEN_QUESTIONS.map((q) => (
                    <li key={q}>{q}</li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
          <div className="gj-card">
            <SectionHead id="gj-apply-title" title={FOUNDING_PAGE.formTitle} />
            <FoundingForm />
          </div>
        </div>
      </Section>
    </main>
  );
}
