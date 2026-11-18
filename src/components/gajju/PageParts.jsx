// Building blocks shared by the Gajju pages (Gajju Mini, Build log, About). They use the same
// classes as the Home page sections, so every page looks the same.
import Icon from '../Icon.jsx';
import { Section, SectionHead } from './Section.jsx';
import SignupForm from './SignupForm.jsx';
import { SHOW_PENDING, StatusLabel } from './Labels.jsx';
import Faq from './Faq.jsx';
import { JOIN } from '../../content/home.js';

export const ICON = { strokeWidth: 1.5 };

/** Page hero: eyebrow, h1, lead, buttons (children) and an optional picture beside the text. */
export function PageHero({ id = 'top', eyebrow, title, lead, media, navSection, children }) {
  return (
    <section
      className={`gj-section gj-hero gj-page-hero gj-section--cream${media ? '' : ' gj-page-hero--text'}`}
      id={id}
      data-nav-section={navSection}
      aria-labelledby={`${id}-title`}
    >
      <div className="gj-container">
        <div className={media ? 'gj-hero__grid' : undefined}>
          <div>
            {eyebrow && <p className="gj-eyebrow">{eyebrow}</p>}
            <h1 className="gj-h1" id={`${id}-title`}>
              {title}
            </h1>
            {lead && <p className="gj-hero__lead">{lead}</p>}
            {children && <div className="gj-btns">{children}</div>}
          </div>
          {media}
        </div>
      </div>
    </section>
  );
}

/** Activity cards: icon, name, one line, and the skill it teaches. `columns`: 2 or 3 on desktop. */
export function ActivityCards({ items, columns = 3 }) {
  return (
    <ul className={`gj-grid gj-grid--${columns}`}>
      {items.map((a) => (
        <li className="gj-card" key={a.name} data-reveal>
          <span className="gj-icon">
            <Icon name={a.icon} {...ICON} />
          </span>
          <h3 className="gj-h3">{a.name}</h3>
          <p>{a.line}</p>
          {a.skill && (
            <span className="gj-skill">
              Teaches: <strong>{a.skill}</strong>
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

/** The learning ladder: numbered steps with an icon, class level and one line. */
export function LadderSteps({ steps }) {
  return (
    <ol className="gj-ladder">
      {steps.map((s, i) => (
        <li className="gj-card gj-ladder__step" key={s.name} data-reveal>
          <div className="gj-ladder__top">
            <span className="gj-ladder__num" aria-hidden="true">
              {i + 1}
            </span>
            <span className="gj-icon">
              <Icon name={s.icon} {...ICON} />
            </span>
          </div>
          <h3 className="gj-h3">{s.name}</h3>
          <span className="gj-ladder__level">{s.level}</span>
          <p>{s.line}</p>
        </li>
      ))}
    </ol>
  );
}

/**
 * Key facts beside the 3D viewer (content document, Home section 5). The values come from the
 * design and simulation, so the card carries the document's "Planned" label and note. Facts our
 * engineers still have to confirm (`tbc`) and the note about the model's part count are shown
 * only in review mode.
 */
export function KeyFacts({ facts }) {
  return (
    <div className="gj-card gj-facts" data-reveal>
      <div className="gj-facts__head">
        <h3 className="gj-h3">{facts.factsTitle}</h3>
        <StatusLabel tone="planned">Planned</StatusLabel>
      </div>
      <ul className="gj-facts__list">
        {facts.facts.map((f) => {
          const fact = typeof f === 'string' ? { text: f } : f;
          return (
            <li key={fact.text}>
              <span>
                {fact.text}
                {fact.tbc && SHOW_PENDING && (
                  <>
                    {' '}
                    <StatusLabel tone="awaiting">To be confirmed</StatusLabel>
                  </>
                )}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="gj-caption">{facts.factsNote}</p>
      {SHOW_PENDING && facts.modelNote && <p className="gj-caption">{facts.modelNote}</p>}
    </div>
  );
}

/** Icon + sentence list (safety points, post outline…). */
export function IconList({ items, className = 'gj-hands' }) {
  return (
    <ul className={className}>
      {items.map((item) => (
        <li key={item.text} data-reveal>
          <span className="gj-icon">
            <Icon name={item.icon} {...ICON} />
          </span>
          <p>{item.text}</p>
        </li>
      ))}
    </ul>
  );
}

/**
 * "Join the first-batch list": the shared sign-up form at the end of every page (content
 * document, "Site-wide parts"), with an optional FAQ beside it. Anchor: #join.
 */
export function JoinSection({ tone = 'cream', faq, faqTitle = 'Questions', title = JOIN.title, lead = JOIN.lead, tags }) {
  return (
    <Section id="join" tone={tone} navSection="join" labelledBy="gj-join-title">
      <div className={faq ? 'gj-join' : 'gj-join gj-join--single'}>
        <div className="gj-card">
          <SectionHead id="gj-join-title" eyebrow={JOIN.eyebrow} title={title} lead={lead} />
          <SignupForm tags={tags} />
        </div>
        {faq && (
          <div>
            <h2 className="gj-h2 gj-faq-title">{faqTitle}</h2>
            <Faq items={faq} />
          </div>
        )}
      </div>
    </Section>
  );
}
