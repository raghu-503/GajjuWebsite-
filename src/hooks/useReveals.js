import { useLayoutEffect, useRef } from 'react';
import { gsap, initReveals } from '../js/animations.js';

/**
 * Scroll reveals for `[data-split="auto"]` headlines and `[data-reveal]` blocks inside `rootRef`.
 * Runs again when `deps` change, but only for elements that haven't been revealed yet.
 * Everything (tweens and ScrollTriggers) is reverted when the component unmounts.
 */
export function useReveals(rootRef, deps = []) {
  const ctx = useRef(null);
  useLayoutEffect(() => {
    ctx.current = gsap.context(() => {}, rootRef);
    return () => ctx.current.revert();
  }, [rootRef]);
  useLayoutEffect(() => {
    if (rootRef.current) ctx.current.add(() => initReveals(rootRef.current));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
