// Hero picture as the walking simulation loop (content document, Home hero: "a short silent
// loop of Gajju walking, labelled 'simulation'"). Muted, looping, plays inline.
// - A pause/play button, because it moves for more than 5 seconds (WCAG 2.2.2).
// - With reduced motion it does not autoplay; the poster frame shows until the visitor plays it.
import { useEffect, useRef, useState } from 'react';
import Icon from '../Icon.jsx';
import { MediaLabel } from './Labels.jsx';
import { prefersReducedMotion } from '../../js/env.js';

export default function HeroVideo({ video }) {
  const ref = useRef(null);
  const [playing, setPlaying] = useState(() => !prefersReducedMotion());

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (playing) v.play().catch(() => setPlaying(false)); // autoplay blocked: show the play button
    else v.pause();
  }, [playing]);

  return (
    <figure className="gj-hero__media gj-hero__media--video">
      <video
        ref={ref}
        className="gj-hero__video"
        muted
        loop
        playsInline
        preload={playing ? 'auto' : 'none'}
        poster={video.poster}
        aria-label={video.description}
      >
        <source src={video.webm} type="video/webm" />
        <source src={video.mp4} type="video/mp4" />
      </video>
      <figcaption>
        <MediaLabel>{video.label}</MediaLabel>
      </figcaption>
      <button
        className="gj-tool gj-tool--icon gj-hero__toggle"
        type="button"
        aria-label={playing ? 'Pause the video' : 'Play the video'}
        aria-pressed={!playing}
        onClick={() => setPlaying((p) => !p)}
      >
        <Icon name={playing ? 'pause' : 'play'} strokeWidth={1.5} />
      </button>
    </figure>
  );
}
