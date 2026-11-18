// Hero picture: the real Gajju Mini 3D model, labelled as a render (content document: "render of
// the final design, labelled 'render'"). Three.js loads with this component, not with the page.
import { useEffect, useRef, useState } from 'react';
import { MediaLabel } from './Labels.jsx';

export default function HeroRobot({ label }) {
  const stageRef = useRef(null);
  const [status, setStatus] = useState('loading'); // 'loading' | 'ready' | { error }

  useEffect(() => {
    let alive = true;
    let api = null;
    import('../../js/hero-robot.js').then(
      ({ createHeroRobot }) => {
        if (!alive) return;
        api = createHeroRobot(stageRef.current, {
          onReady: () => alive && setStatus('ready'),
          onError: (error) => alive && setStatus({ error }),
        });
      },
      (err) => {
        console.error(err);
        if (alive) setStatus({ error: "The 3D model couldn't be loaded." });
      },
    );
    return () => {
      alive = false;
      api?.destroy();
    };
  }, []);

  return (
    <figure className="gj-hero__media">
      <div
        className="gj-hero__stage"
        ref={stageRef}
        role="img"
        aria-label="3D render of Gajju Mini: a four-legged baby elephant robot with saffron ears and a trunk."
      />
      {status !== 'ready' && (
        <div className={`gj-stage-status${status.error ? ' is-error' : ''}`} role="status">
          {!status.error && <span className="gj-spinner" aria-hidden="true" />}
          <span>{status.error || 'Loading the 3D model…'}</span>
        </div>
      )}
      <figcaption>
        <MediaLabel>{label}</MediaLabel>
      </figcaption>
    </figure>
  );
}
