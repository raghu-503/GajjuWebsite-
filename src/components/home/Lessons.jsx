// "Learn by building": lesson cards and the lesson dialog with saved progress.
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Icon from '../Icon.jsx';
import SplitText from '../SplitText.jsx';
import { useSite } from '../../context/SiteContext.jsx';
import { LESSONS } from '../../js/data.js';
import { load, save } from '../../js/storage.js';
import { gsap } from '../../js/animations.js';

// Small technical illustrations, one per lesson (static SVG markup).
const ART = {
  start: `<circle cx="60" cy="60" r="34"/><circle cx="60" cy="60" r="4" class="a"/><path d="M60 26v-10M94 60h10M60 94v10M26 60H16"/><path class="a spin" d="M60 60 82 38"/><path d="M42 60a18 18 0 0 1 18-18" class="a"/>`,
  sensors: `<path d="M28 60h12"/><rect x="18" y="48" width="10" height="24" rx="2"/><path class="a wave" d="M46 44a22 22 0 0 1 0 32"/><path class="a wave w2" d="M56 36a34 34 0 0 1 0 48"/><path class="a wave w3" d="M66 28a46 46 0 0 1 0 64"/><rect x="96" y="40" width="8" height="40"/>`,
  motors: `<path d="M12 80h12V40h12v40h12V40h12v40h12V40h12v40h12V40h12" class="a"/><path d="M12 96h96"/><path d="M12 24h96" stroke-dasharray="3 5"/>`,
  mcu: `<rect x="36" y="36" width="48" height="48" rx="4"/><rect x="50" y="50" width="20" height="20" class="a"/><path d="M44 36V24M56 36V24M68 36V24M80 36V24M44 84v12M56 84v12M68 84v12M80 84v12M36 44H24M36 56H24M36 68H24M84 44h12M84 56h12M84 68h12"/>`,
  assembly: `<rect x="22" y="70" width="76" height="8" rx="2"/><rect x="22" y="40" width="76" height="8" rx="2" class="a lift"/><path d="M30 48v22M90 48v22"/><circle cx="34" cy="90" r="10"/><circle cx="86" cy="90" r="10"/>`,
  projects: `<path d="M16 92c20-40 40 10 58-30s20-30 30-36" class="a draw"/><circle cx="16" cy="92" r="4"/><circle cx="104" cy="26" r="4" class="a"/><path d="M16 104h92M16 16v88" stroke-dasharray="2 4"/>`,
};

const Art = ({ id }) => (
  <svg
    viewBox="0 0 120 120"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    dangerouslySetInnerHTML={{ __html: ART[id] }}
  />
);

function LessonDialog({ lesson, done, onToggle, onComplete, onClose }) {
  const ref = useRef(null);
  const { lenis } = useSite();

  // Open as a modal, pause smooth scroll while it's open.
  useLayoutEffect(() => {
    const dialog = ref.current;
    if (!lesson) return;
    if (!dialog.open) dialog.showModal();
    lenis?.stop();
    gsap.fromTo(dialog, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power3.out' });
    return () => lenis?.start();
  }, [lesson, lenis]);

  useEffect(() => {
    const dialog = ref.current;
    const onNativeClose = () => onClose();
    dialog.addEventListener('close', onNativeClose); // Escape key
    return () => dialog.removeEventListener('close', onNativeClose);
  }, [onClose]);

  const close = () => ref.current.close();

  return (
    <dialog
      className="lesson-dialog"
      aria-labelledby="lesson-title"
      ref={ref}
      onClick={(e) => e.target === ref.current && close()}
    >
      {lesson && (
        <div className="ld">
          <button className="icon-btn ld__close" aria-label="Close lesson" onClick={close}>
            <Icon name="x" />
          </button>
          <div className="ld__art" aria-hidden="true">
            <Art id={lesson.id} />
          </div>
          <div className="ld__body">
            <div className="ld__pills">
              <span className="pill">{lesson.level}</span>
              <span className="pill">{lesson.mins} min</span>
            </div>
            <h3 id="lesson-title">{lesson.title}</h3>
            <p>{lesson.summary}</p>
            <h4>Lesson outline</h4>
            <ol className="ld__steps">
              {lesson.points.map((p, i) => (
                <li key={i}>
                  <label>
                    <input type="checkbox" checked={!!done[i]} onChange={(e) => onToggle(i, e.target.checked)} />
                    <span>{p}</span>
                  </label>
                </li>
              ))}
            </ol>
            <p className="muted ld__note">Tick each part as you finish it. Progress is saved in this browser.</p>
            <div className="ld__actions">
              <button
                className="btn btn--primary"
                onClick={() => {
                  onComplete();
                  close();
                }}
              >
                Mark lesson complete
              </button>
              <button className="btn btn--ghost" onClick={close}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </dialog>
  );
}

export default function Lessons() {
  const [progress, setProgress] = useState(() => load('lessons', {}));
  const [openId, setOpenId] = useState(null);
  const lesson = LESSONS.find((l) => l.id === openId) || null;
  const pct = (l) => Math.round(((progress[l.id] || []).filter(Boolean).length / l.points.length) * 100);

  const update = (id, list) =>
    setProgress((prev) => {
      const next = { ...prev, [id]: list };
      save('lessons', next);
      return next;
    });
  const toggle = (i, on) => {
    const list = lesson.points.map((_, j) => !!(progress[lesson.id] || [])[j]);
    list[i] = on;
    update(lesson.id, list);
  };
  const complete = () => update(lesson.id, lesson.points.map(() => true));
  const onClose = useCallback(() => setOpenId(null), []);

  return (
    <section className="learn" id="learn" data-nav-section="learn">
      <header className="section-head">
        <SplitText className="display display--md" text="LEARN BY BUILDING." />
        <p data-reveal>
          Short lessons written for the hardware you own. Open one to see the outline and track your progress.
        </p>
      </header>
      <div className="lessons">
        {LESSONS.map((l, i) => {
          const p = pct(l);
          return (
            <button
              key={l.id}
              type="button"
              className={`lesson${i === 0 ? ' lesson--wide' : ''}`}
              data-reveal
              onClick={() => setOpenId(l.id)}
            >
              <span className="lesson__art" aria-hidden="true">
                <Art id={l.id} />
              </span>
              <span className="lesson__meta">
                <span className="pill">{l.level}</span>
                <span className="lesson__mins">
                  <Icon name="clock" />
                  {l.mins} min
                </span>
              </span>
              <span className="lesson__title">{l.title}</span>
              <span className="lesson__sum">{l.summary}</span>
              <span className="lesson__progress">
                <span style={{ width: `${p}%` }} />
              </span>
              <span className="lesson__cta">
                {p === 100 ? 'Completed, review lesson' : p > 0 ? `Continue, ${p}% done` : 'Open lesson'}
              </span>
            </button>
          );
        })}
      </div>
      <LessonDialog
        lesson={lesson}
        done={lesson ? progress[lesson.id] || [] : []}
        onToggle={toggle}
        onComplete={complete}
        onClose={onClose}
      />
    </section>
  );
}
