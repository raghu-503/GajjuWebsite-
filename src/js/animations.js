import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { prefersReducedMotion, isMobile } from './stage.js';

gsap.registerPlugin(ScrollTrigger);
export { gsap, ScrollTrigger };

export const reduced = prefersReducedMotion();

/* ------------------------------ Smooth scroll ------------------------------ */
export function initLenis() {
  if (reduced) return null;
  const lenis = new Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  return lenis;
}

export function scrollToTarget(lenis, target, immediate = false) {
  const el = typeof target === 'string' ? document.querySelector(target) : target;
  if (!el) return;
  const top = Math.max(0, el.getBoundingClientRect().top + window.scrollY - 72);
  if (lenis) {
    lenis.resize();
    lenis.scrollTo(top, { immediate, duration: 1.4, force: true });
  } else window.scrollTo({ top, behavior: immediate || reduced ? 'auto' : 'smooth' });
}

/* ------------------------------ Loader ------------------------------ */
export function runLoader(page) {
  const loader = document.querySelector('[data-loader]');
  const bar = document.querySelector('[data-loader-bar]');
  const label = document.querySelector('[data-loader-label]');
  const firstVisit = !sessionStorage.getItem('nx-loaded');
  const full = page === 'home' && firstVisit && !reduced;
  try { sessionStorage.setItem('nx-loaded', '1'); } catch { /* ignore */ }

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
    gsap.fromTo('.loader .logo-mark__frame', { strokeDasharray: 120, strokeDashoffset: 120 }, { strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut' });
    gsap.fromTo('.loader .logo-mark__n', { strokeDasharray: 60, strokeDashoffset: 60 }, { strokeDashoffset: 0, duration: 0.9, delay: 0.4, ease: 'power2.out' });
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

/* ------------------------------ Page transitions ------------------------------ */
export function initTransitions(lenis, page) {
  const curtain = document.querySelector('[data-curtain]');
  if (sessionStorage.getItem('nx-transition') === '1' && !reduced) {
    sessionStorage.removeItem('nx-transition');
    gsap.set(curtain, { scaleY: 1, transformOrigin: 'top' });
    gsap.to(curtain, { scaleY: 0, duration: 0.7, ease: 'power4.inOut', delay: 0.1 });
  }
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) gsap.set(curtain, { scaleY: 0 });
  });

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank' || a.hasAttribute('download')) return;
    const url = new URL(a.getAttribute('href'), location.href);
    if (url.origin !== location.origin) return;
    const samePage = url.pathname === location.pathname || (page === 'home' && /\/(index\.html)?$/.test(url.pathname) && /\/(index\.html)?$/.test(location.pathname));
    if (samePage && url.hash) {
      e.preventDefault();
      scrollToTarget(lenis, url.hash);
      history.replaceState(null, '', url.hash);
      return;
    }
    if (samePage && url.search === location.search) {
      e.preventDefault();
      if (lenis) lenis.scrollTo(0);
      else window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (reduced) return;
    e.preventDefault();
    try { sessionStorage.setItem('nx-transition', '1'); } catch { /* ignore */ }
    gsap.set(curtain, { transformOrigin: 'bottom' });
    gsap.to(curtain, { scaleY: 1, duration: 0.5, ease: 'power4.inOut', onComplete: () => (location.href = url.href) });
  });
}

/* ------------------------------ Cursor ------------------------------ */
export function initCursor() {
  const cursor = document.querySelector('.cursor');
  if (reduced || isMobile() || !window.matchMedia('(pointer: fine)').matches) {
    cursor?.remove();
    return;
  }
  document.documentElement.classList.add('has-cursor');
  const dot = cursor.querySelector('.cursor__dot');
  const ring = cursor.querySelector('.cursor__ring');
  const pos = { x: innerWidth / 2, y: innerHeight / 2 };
  const ringPos = { ...pos };
  window.addEventListener('pointermove', (e) => {
    pos.x = e.clientX;
    pos.y = e.clientY;
    dot.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
    cursor.classList.add('is-visible');
  });
  document.addEventListener('pointerleave', () => cursor.classList.remove('is-visible'));
  gsap.ticker.add(() => {
    ringPos.x += (pos.x - ringPos.x) * 0.18;
    ringPos.y += (pos.y - ringPos.y) * 0.18;
    ring.style.transform = `translate(${ringPos.x}px, ${ringPos.y}px)`;
  });
  document.addEventListener('pointerover', (e) => {
    const t = e.target.closest('a, button, [data-cursor], input, select, label');
    cursor.classList.toggle('is-hover', !!t && !t.matches('[data-cursor="drag"]'));
    cursor.classList.toggle('is-drag', !!t && t.matches('[data-cursor="drag"]'));
  });
  document.addEventListener('pointerdown', () => cursor.classList.add('is-down'));
  document.addEventListener('pointerup', () => cursor.classList.remove('is-down'));
}

/* ------------------------------ Text + reveals ------------------------------ */
export function splitWords(el) {
  if (el.dataset.split) return el.querySelectorAll('.w > span');
  const html = el.innerHTML;
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  const out = [];
  tmp.childNodes.forEach((node) => {
    if (node.nodeType === 3) {
      node.textContent.split(/(\s+)/).forEach((tok) => {
        if (!tok) return;
        out.push(/^\s+$/.test(tok) ? ' ' : `<span class="w"><span>${tok}</span></span>`);
      });
    } else if (node.nodeName === 'BR') out.push('<br>');
    else out.push(`<span class="w"><span>${node.outerHTML}</span></span>`);
  });
  el.innerHTML = out.join('');
  el.dataset.split = '1';
  el.setAttribute('aria-label', tmp.textContent.replace(/\s+/g, ' ').trim());
  return el.querySelectorAll('.w > span');
}

export function revealHeadline(el, opts = {}) {
  const words = splitWords(el);
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

export function initReveals(root = document) {
  root.querySelectorAll('[data-split]:not([data-split="1"])').forEach((el) => revealHeadline(el));
  const items = root.querySelectorAll('[data-reveal]');
  if (reduced) {
    gsap.set(items, { opacity: 1, y: 0 });
    return;
  }
  ScrollTrigger.batch(items, {
    start: 'top 88%',
    once: true,
    onEnter: (batch) => gsap.fromTo(batch, { opacity: 0, y: 34 }, { opacity: 1, y: 0, duration: 0.9, stagger: 0.09, ease: 'power3.out', overwrite: true }),
  });
  root.querySelectorAll('[data-parallax]').forEach((el) => {
    const amt = Number(el.dataset.parallax) || 60;
    gsap.fromTo(el, { y: -amt / 2 }, { y: amt / 2, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
}
