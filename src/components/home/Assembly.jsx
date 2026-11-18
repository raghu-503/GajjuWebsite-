// "From components to creation": the seven-step build guide.
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Icon from '../Icon.jsx';
import SplitText from '../SplitText.jsx';
import { useWhenNear } from '../../hooks/useWhenNear.js';
import { ASSEMBLY_STEPS } from '../../js/data.js';
import { gsap, reduced } from '../../js/animations.js';

const LAST = ASSEMBLY_STEPS.length - 1;

export default function Assembly() {
  const sectionRef = useRef(null);
  const stageRef = useRef(null);
  const detailRef = useRef(null);
  const api = useRef(null);
  const near = useWhenNear(sectionRef);
  const [current, setCurrent] = useState(0);
  const currentRef = useRef(0);
  currentRef.current = current;
  const [status, setStatus] = useState(null); // null | 'loading' | { error }

  useEffect(() => {
    if (!near) return;
    setStatus('loading');
    let alive = true;
    // The 3D controller (and Three.js) loads only when the section comes near the viewport.
    // It starts on the step currently selected, even if that changed while it was loading.
    import('../../js/assembly.js').then(
      ({ createAssembly }) => {
        if (!alive) return;
        api.current = createAssembly(
          stageRef.current,
          { onReady: () => setStatus(null), onError: (error) => setStatus({ error }) },
          currentRef.current,
        );
      },
      (err) => {
        console.error(err);
        if (alive) setStatus({ error: 'The 3D view could not be loaded. Check your connection and reload the page.' });
      },
    );
    return () => {
      alive = false;
      api.current?.destroy();
      api.current = null;
    };
  }, [near]);

  // Drive the 3D scene and animate the step text whenever the step changes.
  const firstRun = useRef(true);
  useLayoutEffect(() => {
    if (!firstRun.current) api.current?.goTo(current);
    firstRun.current = false;
    gsap.fromTo(
      detailRef.current.children,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, stagger: 0.05, duration: reduced ? 0.01 : 0.5, ease: 'power3.out' },
    );
  }, [current]);

  const goTo = (n) => setCurrent(Math.max(0, Math.min(LAST, n)));
  const s = ASSEMBLY_STEPS[current];
  const stepNo = current + 1;
  const error = status?.error;

  return (
    <section
      className="assembly"
      id="assembly"
      data-nav-section="explore"
      ref={sectionRef}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') goTo(current + 1);
        if (e.key === 'ArrowLeft') goTo(current - 1);
      }}
    >
      <header className="section-head">
        <SplitText className="display display--md" text="FROM COMPONENTS TO CREATION." />
        <p data-reveal>
          Seven steps take GAJJU from 104 parts to a robot that stands on its own four legs. Every step below uses the
          real CAD assembly.
        </p>
      </header>
      <div className="asm" data-reveal>
        <div className="asm__stage studio gstage" ref={stageRef}>
          {status && (
            <div className={`gstage__status${error ? ' is-error' : ''}`} role="status">
              <span className="gstage__spinner" aria-hidden="true" />
              <span>{error || 'Loading GAJJU CAD model…'}</span>
            </div>
          )}
        </div>
        <div className="asm__side">
          <div className="asm__progress">
            <span style={{ width: `${(stepNo / ASSEMBLY_STEPS.length) * 100}%` }} />
          </div>
          <ol className="asm__steps">
            {ASSEMBLY_STEPS.map((step, i) => (
              <li key={step.title}>
                <button
                  type="button"
                  className={i === current ? 'is-active' : i < current ? 'is-done' : undefined}
                  aria-current={i === current ? 'step' : 'false'}
                  onClick={() => goTo(i)}
                >
                  <span className="asm__n">{i + 1}</span>
                  <span>{step.title}</span>
                </button>
              </li>
            ))}
          </ol>
          <div className="asm__detail" aria-live="polite" ref={detailRef}>
            <span className="asm__big" aria-hidden="true">
              {String(stepNo).padStart(2, '0')}
            </span>
            <h3>{s.title}</h3>
            <p>{s.text}</p>
            <div className="asm__parts">
              {s.parts.map((x) => (
                <span key={x} className="pill">
                  {x}
                </span>
              ))}
            </div>
            <span className="asm__time">
              <Icon name="clock" />
              About {s.time}
            </span>
          </div>
          <div className="asm__nav">
            <button className="btn btn--ghost" disabled={current === 0} onClick={() => goTo(current - 1)}>
              <Icon name="chevron-left" />
              Previous
            </button>
            <span className="asm__count">
              Step {stepNo} of {ASSEMBLY_STEPS.length}
            </span>
            <button className="btn btn--primary" onClick={() => goTo(current === LAST ? 0 : current + 1)}>
              {current === LAST ? (
                <>
                  <Icon name="rotate-ccw" />
                  Start over
                </>
              ) : (
                <>
                  Next step
                  <Icon name="chevron-right" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
