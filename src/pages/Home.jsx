// Home page: the ten sections from the content document, in its order (Appendix A), styled with
// the Gajju brand guidelines (css/gajju-home.css). Copy lives in content/home.js.
// Rhythm per the brand guidelines: light, light, dark (open design, the only dark band), light…
import { useCallback, useRef, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { Section, SectionHead } from '../components/gajju/Section.jsx';
import { MediaLabel, Pending, SHOW_PENDING, StatusLabel } from '../components/gajju/Labels.jsx';
import { KeyFacts } from '../components/gajju/PageParts.jsx';
import HeroVideo from '../components/gajju/HeroVideo.jsx';
import InsideViewer from '../components/gajju/InsideViewer.jsx';
import SignupForm from '../components/gajju/SignupForm.jsx';
import Faq from '../components/gajju/Faq.jsx';
import WalkVideoDialog from '../components/gajju/WalkVideoDialog.jsx';
import { useReveals } from '../hooks/useReveals.js';
import { usePageMeta } from '../hooks/usePageMeta.js';
import {
  ACTIVITIES,
  BUILD_LOG_POSTS,
  BUILD_STEPS,
  FAQ,
  FOUNDING,
  HERO,
  INSIDE,
  JOIN,
  LADDER,
  LINKS,
  OPEN_DESIGN,
  SMALL_HANDS,
  WHERE,
} from '../content/home.js';

const JOIN_HREF = '#join';
const ICON = { strokeWidth: 1.5 };

/* 1. Hero */
function Hero({ onWatch }) {
  return (
    <section className="gj-section gj-hero gj-section--cream" id="top" data-nav-section="home" aria-labelledby="gj-hero-title">
      <div className="gj-container">
        <div className="gj-hero__grid">
          <div>
            <p className="gj-eyebrow">{HERO.eyebrow}</p>
            <h1 className="gj-h1" id="gj-hero-title">
              {HERO.title}
            </h1>
            <p className="gj-hero__lead">{HERO.lead}</p>
            <div className="gj-btns">
              <a className="gj-btn gj-btn--primary" href={JOIN_HREF}>
                {HERO.primary}
              </a>
              <button className="gj-btn gj-btn--secondary" type="button" onClick={onWatch} aria-haspopup="dialog">
                <Icon name="play" {...ICON} />
                {HERO.secondary}
              </button>
            </div>
          </div>
          <HeroVideo video={{ ...LINKS.walkVideo, label: HERO.mediaLabel }} />
        </div>
        <ul className="gj-strip" aria-label="Where Gajju Mini stands">
          {HERO.strip.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* 2. What Gajju does */
function Activities() {
  return (
    <Section id="does" tone="paper" navSection="home" labelledBy="gj-does-title">
      <SectionHead id="gj-does-title" eyebrow={ACTIVITIES.eyebrow} title={ACTIVITIES.title} lead={ACTIVITIES.lead} />
      <ul className="gj-grid gj-grid--3">
        {ACTIVITIES.items.map((a) => (
          <li className="gj-card" key={a.name} data-reveal>
            <span className="gj-icon">
              <Icon name={a.icon} {...ICON} />
            </span>
            <h3 className="gj-h3">{a.name}</h3>
            <p>{a.line}</p>
            <span className="gj-skill">
              Teaches: <strong>{a.skill}</strong>
            </span>
          </li>
        ))}
      </ul>
      <p className="gj-note">
        <StatusLabel tone="planned">{ACTIVITIES.status}</StatusLabel>
        <span className="gj-caption">{ACTIVITIES.note}</span>
      </p>
    </Section>
  );
}

/* 3. Open design: the page's one dark band */
function OpenDesign() {
  return (
    <Section id="open-design" tone="dark" navSection="open" labelledBy="gj-open-title">
      <SectionHead id="gj-open-title" eyebrow={OPEN_DESIGN.eyebrow} title={OPEN_DESIGN.title} lead={OPEN_DESIGN.lead} />
      <ul className="gj-grid gj-grid--2">
        {OPEN_DESIGN.items.map((item) => (
          <li className="gj-open__item" key={item.name} data-reveal>
            <span className="gj-icon">
              <Icon name={item.icon} {...ICON} />
            </span>
            <div>
              <h3>{item.name}</h3>
              <p>{item.line}</p>
              <StatusLabel tone="planned">{item.status}</StatusLabel>
            </div>
          </li>
        ))}
      </ul>
      <div className="gj-open__terms" data-reveal>
        <div>
          <h3>Why we share it</h3>
          <p>{OPEN_DESIGN.why}</p>
        </div>
        <div>
          <h3>The software</h3>
          <p>{OPEN_DESIGN.software}</p>
        </div>
        <div>
          <h3>Licences</h3>
          <p className="gj-caption">{OPEN_DESIGN.licence}</p>
        </div>
      </div>
      <div className="gj-btns">
        <a className="gj-btn gj-btn--primary" href={JOIN_HREF}>
          {HERO.primary}
        </a>
        {LINKS.github && (
          <a className="gj-btn gj-btn--secondary" href={LINKS.github} target="_blank" rel="noopener noreferrer">
            See it on GitHub
            <Icon name="arrow-up-right" {...ICON} />
          </a>
        )}
        {/* Content document, Home section 3: "Buttons: See it on GitHub · Read the build log". */}
        <a className="gj-btn gj-btn--secondary" href="/build-log">
          Read the build log
          <Icon name="arrow-right" {...ICON} />
        </a>
      </div>
    </Section>
  );
}

/* 4. Learning ladder */
function Ladder() {
  return (
    <Section id="learn" tone="cream" navSection="learn" labelledBy="gj-learn-title">
      <SectionHead id="gj-learn-title" eyebrow={LADDER.eyebrow} title={LADDER.title} lead={LADDER.lead} />
      <ol className="gj-ladder">
        {LADDER.steps.map((s, i) => (
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
    </Section>
  );
}

/* 5. Inside Gajju Mini: interactive 3D viewer */
function Inside() {
  return (
    <Section id="explore" tone="paper" navSection="explore" labelledBy="gj-inside-title">
      <SectionHead id="gj-inside-title" eyebrow={INSIDE.eyebrow} title={INSIDE.title} />
      <InsideViewer hint={INSIDE.hint} />
      <KeyFacts facts={INSIDE} />
    </Section>
  );
}

/* 6. Build steps: placeholders until the mechanical engineer supplies them */
function BuildSteps() {
  return (
    <Section id="build" tone="cream" navSection="explore" labelledBy="gj-build-title">
      <SectionHead id="gj-build-title" eyebrow={BUILD_STEPS.eyebrow} title={BUILD_STEPS.title} lead={BUILD_STEPS.lead} />
      <ol className="gj-steps">
        {Array.from({ length: BUILD_STEPS.count }, (_, i) => (
          <li className="gj-card gj-step" key={i} data-reveal>
            <div className="gj-placeholder" role="img" aria-label={`Picture for step ${i + 1}, to come`}>
              <MediaLabel>{BUILD_STEPS.pictureLabel}</MediaLabel>
              <span>Picture to come</span>
            </div>
            <p className="gj-part__idx">Step {i + 1}</p>
            <h3 className="gj-h3">
              <Pending note="to come">Step name</Pending>
            </h3>
            <StatusLabel tone="awaiting">{BUILD_STEPS.awaiting}</StatusLabel>
          </li>
        ))}
      </ol>
      <p className="gj-caption gj-after">
        {BUILD_STEPS.note}
      </p>
    </Section>
  );
}

/* 7. Made for small hands */
function SmallHands() {
  return (
    <Section id="safety" tone="paper" navSection="explore" labelledBy="gj-hands-title">
      <SectionHead id="gj-hands-title" eyebrow={SMALL_HANDS.eyebrow} title={SMALL_HANDS.title} />
      <ul className="gj-hands">
        {SMALL_HANDS.items.map((item) => (
          <li key={item.text} data-reveal>
            <span className="gj-icon">
              <Icon name={item.icon} {...ICON} />
            </span>
            <p>{item.text}</p>
          </li>
        ))}
      </ul>
      <p className="gj-note">
        <StatusLabel tone="planned">Design goals</StatusLabel>
        <span className="gj-caption">{SMALL_HANDS.note}</span>
      </p>
    </Section>
  );
}

/* 8. Where we are */
function Where() {
  return (
    <Section id="about" tone="cream" navSection="about" labelledBy="gj-where-title">
      <SectionHead id="gj-where-title" eyebrow={WHERE.eyebrow} title={WHERE.title} />
      <ol className="gj-timeline">
        {WHERE.timeline.map((step) => (
          <li key={step.text} data-reveal>
            <StatusLabel tone={step.status}>{step.label}</StatusLabel>
            <span className="gj-timeline__when">{step.when}</span>
            <p>{step.text}</p>
          </li>
        ))}
      </ol>
      {/* Shown only once real build-log posts exist. */}
      {BUILD_LOG_POSTS.length > 0 && (
        <div className="gj-posts">
          <h3 className="gj-h3">{WHERE.postsTitle}</h3>
          <ul className="gj-grid gj-grid--3 gj-after">
            {BUILD_LOG_POSTS.slice(0, 3).map((post) => (
              <li className="gj-card" key={post.href}>
                {post.image && <img src={post.image} alt={post.imageAlt || ''} loading="lazy" />}
                {post.label && <MediaLabel>{post.label}</MediaLabel>}
                <h4 className="gj-h3">
                  <a href={post.href}>{post.title}</a>
                </h4>
                <p className="gj-caption">{post.date}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Section>
  );
}

/* 9. Founding teachers and makers */
function Founding() {
  return (
    <Section id="founding" tone="paper" navSection="join" labelledBy="gj-founding-title">
      <div className="gj-founding">
        <div>
          <SectionHead id="gj-founding-title" eyebrow={FOUNDING.eyebrow} title={FOUNDING.title} />
          <p data-reveal>
            {FOUNDING.textBefore} <Pending note={FOUNDING.countNote}>{FOUNDING.count}</Pending> {FOUNDING.textAfter}
          </p>
        </div>
        <div className="gj-card gj-card--highlight gj-founding__cta" data-reveal>
          <span className="gj-icon gj-icon--paper">
            <Icon name="users" {...ICON} />
          </span>
          {LINKS.applyForm ? (
            <a className="gj-btn gj-btn--primary" href={LINKS.applyForm}>
              {FOUNDING.apply}
            </a>
          ) : (
            <>
              <StatusLabel tone="planned">Coming</StatusLabel>
              <p>{FOUNDING.applyPending}</p>
              <a className="gj-btn gj-btn--secondary" href={JOIN_HREF}>
                {HERO.primary}
              </a>
            </>
          )}
        </div>
      </div>
    </Section>
  );
}

/* 10. Join the list, and a short FAQ */
function Join() {
  return (
    <Section id="join" tone="cream" navSection="join" labelledBy="gj-join-title">
      {/* #contact kept so existing "Contact" links still land here */}
      <span id="contact" />
      <div className="gj-join">
        <div className="gj-card">
          <SectionHead id="gj-join-title" eyebrow={JOIN.eyebrow} title={JOIN.title} lead={JOIN.lead} />
          <SignupForm />
        </div>
        <div>
          <h2 className="gj-h2 gj-faq-title">
            {JOIN.faqTitle}
          </h2>
          <Faq items={FAQ} />
        </div>
      </div>
    </Section>
  );
}

export default function Home() {
  usePageMeta('/');
  const mainRef = useRef(null);
  useReveals(mainRef);
  const [watching, setWatching] = useState(false);
  const closeVideo = useCallback(() => setWatching(false), []);

  return (
    <main id="main" className="gj" ref={mainRef}>
      <Hero onWatch={() => setWatching(true)} />
      <Activities />
      <OpenDesign />
      <Ladder />
      <Inside />
      {/* Build steps: the step names and pictures are still to come from the mechanical engineer
          (content document, Home section 6), so the section is shown only in review mode. */}
      {SHOW_PENDING && <BuildSteps />}
      <SmallHands />
      <Where />
      <Founding />
      <Join />
      <WalkVideoDialog open={watching} onClose={closeVideo} />
    </main>
  );
}
