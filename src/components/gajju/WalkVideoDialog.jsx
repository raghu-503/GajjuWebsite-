// "Watch Gajju walk": the walking video, labelled "Simulation" on the video itself (content
// document). The clip is LINKS.walkVideo (content/media.js); without one, the dialog says so.
import { useEffect, useRef } from 'react';
import Icon from '../Icon.jsx';
import { useSite } from '../../context/SiteContext.jsx';
import { LINKS } from '../../content/home.js';
import { MediaLabel, StatusLabel } from './Labels.jsx';

export default function WalkVideoDialog({ open, onClose }) {
  const ref = useRef(null);
  const { lenis } = useSite();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      lenis?.stop();
      d.querySelector('video')?.play().catch(() => {}); // start the clip; the controls stay available
    } else if (!open && d.open) {
      d.close();
    }
  }, [open, lenis]);

  useEffect(() => {
    const d = ref.current;
    const onDialogClose = () => {
      d.querySelector('video')?.pause();
      lenis?.start();
      onClose();
    };
    d.addEventListener('close', onDialogClose);
    return () => d.removeEventListener('close', onDialogClose);
  }, [lenis, onClose]);

  const video = LINKS.walkVideo;
  return (
    <dialog
      className="gj-dialog"
      ref={ref}
      aria-labelledby="gj-walk-title"
      onClick={(e) => e.target === ref.current && ref.current.close()} // click on the backdrop
    >
      <div className="gj-dialog__head">
        <h2 id="gj-walk-title">
          Gajju Mini walking <MediaLabel>Simulation</MediaLabel>
        </h2>
        <button className="gj-tool gj-tool--icon" type="button" aria-label="Close" onClick={() => ref.current.close()}>
          <Icon name="x" strokeWidth={1.5} />
        </button>
      </div>
      <div className="gj-dialog__body">
        {video ? (
          <figure className="gj-dialog__video">
            {/* Loaded only when the dialog opens (preload="none"); silent, so no captions needed. */}
            <video controls playsInline muted loop preload="none" poster={video.poster} aria-describedby="gj-walk-desc">
              <source src={video.webm} type="video/webm" />
              <source src={video.mp4} type="video/mp4" />
              {video.captions && <track kind="captions" src={video.captions} srcLang="en" label="English" default />}
            </video>
            <figcaption className="gj-caption" id="gj-walk-desc">
              {video.description}
            </figcaption>
          </figure>
        ) : (
          <div className="gj-placeholder">
            <StatusLabel tone="awaiting">Video file to be supplied</StatusLabel>
            <p>The walking video from our simulation will play here, labelled &ldquo;Simulation&rdquo;.</p>
          </div>
        )}
      </div>
    </dialog>
  );
}
