import { useEffect, useState } from 'react';

/**
 * True once `ref` comes within a viewport of the screen. Below-the-fold 3D sections use it to
 * start their WebGL renderers late, so the page loads with just the hero renderer.
 */
export function useWhenNear(ref) {
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || near) return;
    if (!('IntersectionObserver' in window)) {
      setNear(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        setNear(true);
      },
      { rootMargin: '100% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, near]);
  return near;
}
