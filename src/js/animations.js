import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { prefersReducedMotion } from './stage.js';

gsap.registerPlugin(ScrollTrigger);
export { gsap, ScrollTrigger };

export const reduced = prefersReducedMotion();

/* ------------------------------ Smooth scroll ------------------------------ */
/** Creates Lenis driven by the GSAP ticker. Returns { lenis, destroy } (lenis is null with reduced motion). */
export function createLenis() {
  if (reduced) return { lenis: null, destroy() {} };
  const lenis = new Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  const raf = (time) => lenis.raf(time * 1000);
  gsap.ticker.add(raf);
  gsap.ticker.lagSmoothing(0);
  return {
    lenis,
    destroy() {
      gsap.ticker.remove(raf);
      lenis.destroy();
    },
  };
}

export function scrollToTarget(lenis, target, immediate = false) {
  let el = target;
  if (typeof target === 'string') {
    try {
      el = document.querySelector(target);
    } catch {
      el = null; // not a valid selector
    }
  }
  if (!el) return;
  const top = Math.max(0, el.getBoundingClientRect().top + window.scrollY - 72);
  if (lenis) {
    lenis.resize();
    lenis.scrollTo(top, { immediate, duration: 1.4, force: true });
  } else window.scrollTo({ top, behavior: immediate || reduced ? 'auto' : 'smooth' });
}

export function scrollToTop(lenis, immediate = false) {
  if (lenis) lenis.scrollTo(0, { immediate, force: true });
  else window.scrollTo({ top: 0, behavior: immediate || reduced ? 'auto' : 'smooth' });
  if (immediate) window.scrollTo(0, 0);
}

/* ------------------------------ Loader ------------------------------ */
export function runLoader(loader, { full }) {
  const bar = loader.querySelector('[data-loader-bar]');
  const label = loader.querySelector('[data-loader-label]');

  return new Promise((resolve) => {
    const finish = () => {
      gsap.to(loader, {
        yPercent: -100,
        duration: full ? 0.9 : 0.45,
        ease: 'power4.inOut',
        onComplete: () => {
          loader.style.display = 'none';
          resolve();
        },
      });
    };
    if (!full) {
      loader.classList.add('is-quick');
      requestAnimationFrame(() => setTimeout(finish, 80));
      return;
    }
    const steps = ['Initialising systems', 'Calibrating sensors', 'Loading 3D models', 'Ready'];
    const state = { p: 0 };
    gsap.fromTo(loader.querySelector('.logo-mark__frame'), { strokeDasharray: 120, strokeDashoffset: 120 }, { strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut' });
    gsap.fromTo(loader.querySelector('.logo-mark__n'), { strokeDasharray: 60, strokeDashoffset: 60 }, { strokeDashoffset: 0, duration: 0.9, delay: 0.4, ease: 'power2.out' });
    gsap.to(state, {
      p: 100,
      duration: 1.7,
      ease: 'power2.inOut',
      onUpdate: () => {
        bar.style.width = `${state.p}%`;
        label.textContent = steps[Math.min(3, Math.floor(state.p / 26))];
      },
      onComplete: finish,
    });
  });
}

/* ------------------------------ Cursor ------------------------------ */
export const cursorEnabled = () =>
  !reduced &&
  !window.matchMedia('(max-width: 768px), (pointer: coarse)').matches &&
  window.matchMedia('(pointer: fine)').matches;

/** Custom cursor that follows the pointer. Returns a cleanup function. */
export function initCursor(cursor) {
  document.documentElement.classList.add('has-cursor');
  const dot = cursor.querySelector('.cursor__dot');
  const ring = cursor.querySelector('.cursor__ring');
  const pos = { x: innerWidth / 2, y: innerHeight / 2 };
  const ringPos = { ...pos };
  const onMove = (e) => {
    pos.x = e.clientX;
    pos.y = e.clientY;
    dot.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
    cursor.classList.add('is-visible');
  };
  const onLeave = () => cursor.classList.remove('is-visible');
  const tick = () => {
    ringPos.x += (pos.x - ringPos.x) * 0.18;
    ringPos.y += (pos.y - ringPos.y) * 0.18;
    ring.style.transform = `translate(${ringPos.x}px, ${ringPos.y}px)`;
  };
  const onOver = (e) => {
    const t = e.target.closest?.('a, button, [data-cursor], input, select, label');
    cursor.classList.toggle('is-hover', !!t && !t.matches('[data-cursor="drag"]'));
    cursor.classList.toggle('is-drag', !!t && t.matches('[data-cursor="drag"]'));
  };
  const onDown = () => cursor.classList.add('is-down');
  const onUp = () => cursor.classList.remove('is-down');

  window.addEventListener('pointermove', onMove);
  document.addEventListener('pointerleave', onLeave);
  gsap.ticker.add(tick);
  document.addEventListener('pointerover', onOver);
  document.addEventListener('pointerdown', onDown);
  document.addEventListener('pointerup', onUp);
  return () => {
    document.documentElement.classList.remove('has-cursor');
    window.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerleave', onLeave);
    gsap.ticker.remove(tick);
    document.removeEventListener('pointerover', onOver);
    document.removeEventListener('pointerdown', onDown);
    document.removeEventListener('pointerup', onUp);
  };
}

/* ------------------------------ Text + reveals ------------------------------ */
// Headlines are split into words by the <SplitText> component; these only animate them.
const revealed = new WeakSet();

export function revealHeadline(el, opts = {}) {
  const words = el.querySelectorAll('.w > span');
  if (reduced) return gsap.set(words, { yPercent: 0, opacity: 1 });
  return gsap.fromTo(
    words,
    { yPercent: 110, rotate: 4 },
    {
      yPercent: 0,
      rotate: 0,
      duration: opts.duration || 1.05,
      stagger: opts.stagger || 0.07,
      ease: 'power4.out',
      delay: opts.delay || 0,
      scrollTrigger: opts.immediate ? undefined : { trigger: el, start: 'top 85%', once: true },
    }
  );
}

/** Scroll reveals for headlines ([data-split="auto"]) and blocks ([data-reveal]) not yet revealed. */
export function initReveals(root = document) {
  const fresh = (sel) => [...root.querySelectorAll(sel)].filter((el) => !revealed.has(el) && revealed.add(el));
  fresh('[data-split="auto"]').forEach((el) => revealHeadline(el));
  const items = fresh('[data-reveal]');
  if (!items.length) return;
  if (reduced) {
    gsap.set(items, { opacity: 1, y: 0 });
    return;
  }
  ScrollTrigger.batch(items, {
    start: 'top 88%',
    once: true,
    onEnter: (batch) => gsap.fromTo(batch, { opacity: 0, y: 34 }, { opacity: 1, y: 0, duration: 0.9, stagger: 0.09, ease: 'power3.out', overwrite: true }),
  });
}
