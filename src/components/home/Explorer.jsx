// "Every component has a purpose": the 3D explorer section.
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Icon from '../Icon.jsx';
import SplitText from '../SplitText.jsx';
import { useWhenNear } from '../../hooks/useWhenNear.js';
import { createExplorer } from '../../js/robot-explorer.js';
import { gsap, reduced } from '../../js/animations.js';

const EMPTY = {
  idx: '—',
  name: 'Select a component',
  desc: 'Click a part on the robot or pick one from the list to see what it does.',
};
const CLEARED = {
  ...EMPTY,
  desc: 'Click any part of GAJJU, or pick an assembly from the list, to see what it is.',
};

export default function Explorer() {
  const sectionRef = useRef(null);
  const stageRef = useRef(null);
  const tipRef = useRef(null);
  const nameRef = useRef(null);
  const descRef = useRef(null);
  const api = useRef(null);
  const near = useWhenNear(sectionRef);

  const [status, setStatus] = useState(null); // null | 'loading' | { error }
  const [groups, setGroups] = useState([]);
  const [info, setInfo] = useState(EMPTY);
  const [hoverGroup, setHoverGroup] = useState(null);
  const [exploded, setExploded] = useState(false);

  useEffect(() => {
    if (!near) return;
    setStatus('loading');
    api.current = createExplorer(stageRef.current, {
      tip: tipRef.current,
      onReady: (g) => {
        setGroups(g);
        setStatus(null);
      },
      onError: (error) => setStatus({ error }),
      onSelect: (sel) => setInfo(sel ? { ...sel, key: Math.random() } : CLEARED),
      onHover: setHoverGroup,
    });
    return () => {
      api.current?.destroy();
      api.current = null;
    };
  }, [near]);

  // Fade the panel text in on each new selection.
  useLayoutEffect(() => {
    if (!info.key) return;
    gsap.fromTo(
      [nameRef.current, descRef.current],
      { opacity: 0, y: 8 },
      { opacity: 1, y: 0, duration: reduced ? 0.01 : 0.4, stagger: 0.05 },
    );
  }, [info]);

  const setMode = (on) => {
    if (!api.current?.ready) return;
    setExploded(on);
    api.current.setMode(on);
  };
  const reset = () => {
    if (!api.current?.ready) return;
    setExploded(false);
    api.current.reset();
  };
  const onKeyDown = (e) => {
    if (e.key === 'Escape') return api.current?.clear();
    if (!['ArrowRight', 'ArrowLeft'].includes(e.key) || /input/i.test(document.activeElement.tagName)) return;
    api.current?.step(e.key === 'ArrowRight' ? 1 : -1);
  };

  const error = status?.error;
  return (
    <section className="explorer" id="explore" data-nav-section="explore" ref={sectionRef} onKeyDown={onKeyDown}>
      <header className="section-head section-head--center">
        <SplitText className="display display--md" text="EVERY COMPONENT HAS A PURPOSE." />
        <p data-reveal>
          Drag to orbit, right-drag to pan, scroll or pinch to zoom, and click any of the 104 parts of GAJJU to see its
          CAD name.
        </p>
      </header>
      <div className="explorer__frame studio" data-reveal>
        <div className="explorer__stage" data-cursor="drag" ref={stageRef}>
          {status && (
            <div className={`gstage__status${error ? ' is-error' : ''}`} role="status">
              <span className="gstage__spinner" aria-hidden="true" />
              <span>{error || 'Loading GAJJU CAD model…'}</span>
            </div>
          )}
        </div>
        <div className="explorer__tip" ref={tipRef} hidden />
        <ol className="explorer__list" aria-label="Components" onPointerLeave={() => api.current?.hoverGroup(null)}>
          {groups.map((g) => (
            <li key={g.id}>
              <button
                type="button"
                className={
                  [info.group === g.id && 'is-active', hoverGroup === g.id && 'is-hover'].filter(Boolean).join(' ') ||
                  undefined
                }
                onClick={() => api.current?.selectGroup(g.id)}
                onPointerOver={() => hoverGroup !== g.id && api.current?.hoverGroup(g.id)}
              >
                <span className="dot" />
                {g.label}
                <span className="explorer__count">{g.count}</span>
              </button>
            </li>
          ))}
        </ol>
        <aside className="explorer__panel" aria-live="polite">
          <span className="explorer__idx">{info.idx}</span>
          <h3 ref={nameRef}>{info.name}</h3>
          <p ref={descRef}>{info.desc}</p>
        </aside>
        {!error && (
          <div className="explorer__tools" role="toolbar" aria-label="Viewer controls">
            <button className="tool" aria-pressed={exploded} onClick={() => setMode(true)}>
              <Icon name="boxes" />
              <span>Exploded view</span>
            </button>
            <button className="tool" aria-pressed={!exploded} onClick={() => setMode(false)}>
              <Icon name="box" />
              <span>Assembled</span>
            </button>
            <span className="tool-sep" />
            <button className="tool tool--icon" aria-label="Zoom in" onClick={() => api.current?.dolly(0.78)}>
              <Icon name="zoom-in" />
            </button>
            <button className="tool tool--icon" aria-label="Zoom out" onClick={() => api.current?.dolly(1.28)}>
              <Icon name="zoom-out" />
            </button>
            <button className="tool tool--icon" aria-label="Reset camera" onClick={reset}>
              <Icon name="rotate-ccw" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
