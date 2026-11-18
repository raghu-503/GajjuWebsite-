// "Take a closer look": interactive viewer for the real Gajju Mini CAD model.
// The 3D controller (js/robot-explorer.js, brand mode) owns the canvas, camera, picking and
// highlights; this component renders the controls, part panel and status in the brand style.
// Part names and descriptions come only from the model's own metadata, translated into plain
// English in content/robot-parts.js; CAD names and part numbers are never shown.
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Icon from '../Icon.jsx';
import { useWhenNear } from '../../hooks/useWhenNear.js';
import { gsap, reduced } from '../../js/animations.js';
import { MediaLabel, SHOW_PENDING, StatusLabel } from './Labels.jsx';

const EMPTY = {
  idx: 'Nothing selected',
  name: 'Tap a part',
  desc: 'Choose any part of the robot, or a group below, to see what it is and what it does.',
};

export default function InsideViewer({ hint, label = 'Render of the 3D design' }) {
  const rootRef = useRef(null);
  const stageRef = useRef(null);
  const tipRef = useRef(null);
  const panelRef = useRef(null);
  const api = useRef(null);
  const near = useWhenNear(rootRef);

  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'ready' | { error }
  const [groups, setGroups] = useState([]);
  const [info, setInfo] = useState(EMPTY);
  const [hoverGroup, setHoverGroup] = useState(null);
  const [exploded, setExploded] = useState(false);

  useEffect(() => {
    if (!near) return;
    setStatus('loading');
    let alive = true;
    import('../../js/robot-explorer.js').then(
      ({ createExplorer }) => {
        if (!alive) return;
        api.current = createExplorer(
          stageRef.current,
          {
            tip: tipRef.current,
            onReady: (g) => {
              setGroups(g);
              setStatus('ready');
            },
            onError: () => setStatus({ error: "The 3D model couldn't be loaded. Please reload the page to try again." }),
            onSelect: (sel) => setInfo(sel ? { ...sel, key: Math.random() } : EMPTY),
            onHover: setHoverGroup,
          },
          { brand: true },
        );
      },
      (err) => {
        console.error(err);
        if (alive) setStatus({ error: "The 3D viewer couldn't be loaded. Check your connection and reload the page." });
      },
    );
    return () => {
      alive = false;
      api.current?.destroy();
      api.current = null;
    };
  }, [near]);

  // Fade the part text in on each new selection (instant with reduced motion).
  useLayoutEffect(() => {
    if (!info.key || reduced) return;
    gsap.fromTo(panelRef.current.children, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.3, stagger: 0.04 });
  }, [info]);

  const ready = status === 'ready';
  const setMode = (on) => {
    if (!ready) return;
    setExploded(on);
    api.current.setMode(on);
  };
  const reset = () => {
    if (!ready) return;
    setExploded(false);
    api.current.reset();
  };
  const onKeyDown = (e) => {
    if (e.key === 'Escape') return api.current?.clear();
    if (!['ArrowRight', 'ArrowLeft'].includes(e.key) || !e.currentTarget.contains(document.activeElement)) return;
    if (/input|select|textarea/i.test(document.activeElement.tagName)) return;
    e.preventDefault();
    api.current?.step(e.key === 'ArrowRight' ? 1 : -1);
  };

  const error = status.error;
  return (
    <div className="gj-inside" ref={rootRef} onKeyDown={onKeyDown}>
      <div className="gj-viewer">
        <div
          className="gj-viewer__stage"
          ref={stageRef}
          tabIndex={0}
          role="application"
          aria-roledescription="3D viewer"
          aria-label="Gajju Mini 3D model. Drag to turn, pinch or scroll to zoom, tap a part to inspect it. Left and right arrow keys step through the parts."
        >
          {status !== 'ready' && (
            <div className={`gj-stage-status${error ? ' is-error' : ''}`} role="status">
              {!error && <span className="gj-spinner" aria-hidden="true" />}
              <span>{error || 'Loading the 3D model…'}</span>
            </div>
          )}
          <span className="gj-viewer__label">
            <MediaLabel>{label}</MediaLabel>
          </span>
        </div>
        <div className="gj-viewer__tip" ref={tipRef} hidden />
        <div className="gj-viewer__tools" role="toolbar" aria-label="Viewer controls">
          <button className="gj-tool" type="button" aria-pressed={!exploded} disabled={!ready} onClick={() => setMode(false)}>
            <Icon name="box" strokeWidth={1.5} />
            Assembled
          </button>
          <button className="gj-tool" type="button" aria-pressed={exploded} disabled={!ready} onClick={() => setMode(true)}>
            <Icon name="boxes" strokeWidth={1.5} />
            Exploded
          </button>
          <span className="gj-tool__sep" />
          <button className="gj-tool gj-tool--icon" type="button" aria-label="Zoom in" disabled={!ready} onClick={() => api.current?.dolly(0.78)}>
            <Icon name="zoom-in" strokeWidth={1.5} />
          </button>
          <button className="gj-tool gj-tool--icon" type="button" aria-label="Zoom out" disabled={!ready} onClick={() => api.current?.dolly(1.28)}>
            <Icon name="zoom-out" strokeWidth={1.5} />
          </button>
          <button className="gj-tool" type="button" disabled={!ready} onClick={reset}>
            <Icon name="rotate-ccw" strokeWidth={1.5} />
            Reset view
          </button>
        </div>
      </div>

      <div className="gj-viewer__side">
        <p className="gj-caption">{hint}</p>
        <div className="gj-card gj-part" aria-live="polite" ref={panelRef}>
          <span className="gj-part__idx">{info.idx}</span>
          <h3 className="gj-h3">{info.name}</h3>
          <p>{info.desc}</p>
          {/* Engineering notes (e.g. which board runs the camera): review mode only. */}
          {info.tbc && SHOW_PENDING && (
            <p className="gj-caption gj-part__tbc">
              <StatusLabel tone="awaiting">To be confirmed</StatusLabel> {info.tbc}
            </p>
          )}
        </div>
        {groups.length > 0 && (
          <div>
            <p className="gj-caption">Parts of the robot</p>
            <ul className="gj-groups" aria-label="Parts of the robot" onPointerLeave={() => api.current?.hoverGroup(null)}>
              {groups.map((g) => (
                <li key={g.id}>
                  <button
                    type="button"
                    aria-pressed={info.group === g.id && !info.part}
                    className={[info.group === g.id && 'is-active', hoverGroup === g.id && 'is-hover'].filter(Boolean).join(' ') || undefined}
                    onClick={() => api.current?.selectGroup(g.id)}
                    onPointerOver={() => hoverGroup !== g.id && api.current?.hoverGroup(g.id)}
                  >
                    {g.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
