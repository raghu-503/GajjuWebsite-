// Gajju Mini page (/gajju-mini). Content: content/gajju-mini.js (content document v4).
// No price, no purchase or reservation: the main action is the first-batch list.
import { useCallback, useRef, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { Section, SectionHead } from '../components/gajju/Section.jsx';
import { MediaLabel, Pending, SHOW_PENDING, StatusLabel } from '../components/gajju/Labels.jsx';
import { PageHero, ActivityCards, LadderSteps, IconList, JoinSection, KeyFacts, ICON } from '../components/gajju/PageParts.jsx';
import HeroRobot from '../components/gajju/HeroRobot.jsx';
import InsideViewer from '../components/gajju/InsideViewer.jsx';
import WalkVideoDialog from '../components/gajju/WalkVideoDialog.jsx';
import { useReveals } from '../hooks/useReveals.js';
import { usePageMeta } from '../hooks/usePageMeta.js';
import { LADDER, INSIDE } from '../content/home.js';
import { WALK_LOOP } from '../content/media.js';
import { HERO, WHAT_IT_DOES, SEE_IT, KIT, SPECS, SAFE, LEARN, FAQ } from '../content/gajju-mini.js';

const STATUS_TONE = { design: 'done', planned: 'planned', tbc: 'awaiting' };
// Outside review mode, rows still awaiting engineering confirmation show the content document's
// "Planned" label ("Show a 'planned' label on the table until then"), without the internal note.
const shownStatus = (status) => (status === 'tbc' && !SHOW_PENDING ? 'planned' : status);
const STATUS_TEXT = Object.fromEntries(SPECS.legend.map(([key, label]) => [key, label]));

function KitValue({ value }) {
  if (typeof value === 'string') return value;
  if (!SHOW_PENDING) return value.fallback; // the confirmed part of the answer only
  return (
    <>
      <Pending note={value.note}>{value.pending}</Pending>
      {value.after}
    </>
  );
}

function Specifications() {
  return (
    <Section id="specifications" tone="cream" labelledBy="gj-specs-title">
      <SectionHead id="gj-specs-title" title={SPECS.title} lead={SPECS.note} />
      <ul className="gj-legend" aria-label="What the labels mean">
        {SPECS.legend.filter(([key]) => key !== 'tbc' || SHOW_PENDING).map(([key, label, text]) => (
          <li key={key}>
            <StatusLabel tone={STATUS_TONE[key]}>{label}</StatusLabel>
            <span className="gj-caption">{text}</span>
          </li>
        ))}
      </ul>
      <div className="gj-card gj-specs" data-reveal>
        <table className="gj-table">
          <caption className="sr-only">Gajju Mini specifications, with the status of each value</caption>
          <thead>
            <tr>
              <th scope="col">Part</th>
              <th scope="col">Gajju Mini</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {SPECS.rows.map((row) => (
              <tr key={row.label}>
                <th scope="row">{row.label}</th>
                <td>
                  {row.value}
                  {row.why && SHOW_PENDING && <span className="gj-table__why">{row.why}</span>}
                </td>
                <td>
                  <StatusLabel tone={STATUS_TONE[shownStatus(row.status)]}>{STATUS_TEXT[shownStatus(row.status)]}</StatusLabel>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

export default function GajjuMini() {
  usePageMeta('/gajju-mini');
  const mainRef = useRef(null);
  useReveals(mainRef);
  const [watching, setWatching] = useState(false);
  const closeVideo = useCallback(() => setWatching(false), []);
  const openVideo = () => setWatching(true);

  return (
    <main id="main" className="gj" ref={mainRef}>
      <PageHero eyebrow={HERO.eyebrow} title={HERO.title} lead={HERO.lead} media={<HeroRobot label={HERO.mediaLabel} />}>
        <a className="gj-btn gj-btn--primary" href="#join">
          {HERO.primary}
        </a>
        <button className="gj-btn gj-btn--secondary" type="button" onClick={openVideo} aria-haspopup="dialog">
          <Icon name="play" {...ICON} />
          {HERO.secondary}
          <span className="gj-btn__note">(simulation)</span>
        </button>
      </PageHero>

      <Section id="what-it-does" tone="paper" labelledBy="gj-does-title">
        <SectionHead id="gj-does-title" title={WHAT_IT_DOES.title} lead={WHAT_IT_DOES.text}>
          <p className="gj-lead">{WHAT_IT_DOES.intro}</p>
        </SectionHead>
        <ActivityCards items={WHAT_IT_DOES.items} />
        <p className="gj-note">
          <StatusLabel tone="planned">{WHAT_IT_DOES.status}</StatusLabel>
          <span className="gj-caption">{WHAT_IT_DOES.note}</span>
        </p>
      </Section>

      <Section id="see-it-walk" tone="cream" labelledBy="gj-walk-title">
        <SectionHead id="gj-walk-title" title={SEE_IT.title} />
        <div className="gj-card gj-video-card" data-reveal>
          <figure className="gj-video-card__media">
            {/* Loads only when played (preload="none"), as the content document asks for video. */}
            <video controls playsInline muted loop preload="none" poster={WALK_LOOP.poster} aria-describedby="gj-walk-inline-desc">
              <source src={WALK_LOOP.webm} type="video/webm" />
              <source src={WALK_LOOP.mp4} type="video/mp4" />
            </video>
            <span className="gj-video-card__label">
              <MediaLabel>{WALK_LOOP.label}</MediaLabel>
            </span>
          </figure>
          <div>
            <h3 className="gj-h3">{SEE_IT.videoTitle}</h3>
            <p id="gj-walk-inline-desc">{SEE_IT.videoText}</p>
          </div>
        </div>
        <h3 className="gj-h2 gj-subhead">{SEE_IT.viewerTitle}</h3>
        <InsideViewer hint={SEE_IT.hint} />
        <KeyFacts facts={INSIDE} />
      </Section>

      <Section id="kit-or-ready-made" tone="paper" labelledBy="gj-kit-title">
        <SectionHead id="gj-kit-title" title={KIT.title} lead={KIT.lead} />
        <div className="gj-grid gj-grid--2">
          {KIT.options.map((opt) => (
            <div className="gj-card gj-option" key={opt.name} data-reveal>
              <h3 className="gj-h3">{opt.name}</h3>
              <dl>
                {opt.rows.map(([term, value]) => (
                  <div key={term}>
                    <dt>{term}</dt>
                    <dd>
                      <KitValue value={value} />
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
        <p className="gj-caption gj-after">{KIT.note}</p>
      </Section>

      <Specifications />

      <Section id="learning" tone="paper" labelledBy="gj-learn-title">
        <SectionHead id="gj-learn-title" eyebrow={LEARN.eyebrow} title={LEARN.title} lead={LEARN.lead} />
        <LadderSteps steps={LADDER.steps} />
      </Section>

      <Section id="safe-by-design" tone="cream" labelledBy="gj-safe-title">
        <SectionHead id="gj-safe-title" title={SAFE.title} />
        <IconList items={SAFE.items} />
        <p className="gj-note">
          <StatusLabel tone="planned">{SAFE.status}</StatusLabel>
          <span className="gj-caption">{SAFE.note}</span>
        </p>
      </Section>

      <JoinSection tone="paper" faq={FAQ} />
      <WalkVideoDialog open={watching} onClose={closeVideo} />
    </main>
  );
}
