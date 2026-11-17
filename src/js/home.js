import { initSite } from './main.js';
import { initHeroScene } from './three-scene.js';
import { initShowcase } from './products.js';
import { initExplorer } from './robot-explorer.js';
import { initAssembly } from './assembly.js';
import { initLearn } from './learn.js';
import { gsap, reduced, revealHeadline } from './animations.js';
import { save } from './storage.js';

const site = initSite('home');

const hero = initHeroScene(document.querySelector('[data-hero-stage]'), document.querySelector('[data-hero-labels]'));
initShowcase(document.querySelector('#products'));
// Below-the-fold 3D sections start their WebGL renderers only when they come within a viewport
// of the screen, so the page loads with just the hero renderer.
function whenNear(el, init) {
  if (!el) return;
  if (!('IntersectionObserver' in window)) return init(el);
  const io = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      init(el);
    },
    { rootMargin: '100% 0px' }
  );
  io.observe(el);
}
whenNear(document.querySelector('#explore'), initExplorer);
whenNear(document.querySelector('#assembly'), initAssembly);
initLearn(document.querySelector('#learn'));

// Hero title is split now but revealed after the loader.
const heroTitle = document.querySelector('[data-hero-title]');
const heroFade = document.querySelectorAll('[data-hero-fade]');
if (!reduced) gsap.set(heroFade, { opacity: 0, y: 24 });

site.hydrate();

site.ready.then(() => {
  revealHeadline(heroTitle, { immediate: true, stagger: 0.12, duration: 1.3 });
  if (!reduced) gsap.to(heroFade, { opacity: 1, y: 0, duration: 1, stagger: 0.12, delay: 0.5, ease: 'power3.out' });
  hero?.playIntro();
});

// Hero title parallax: the type drifts slower than the robot as you scroll.
if (!reduced) {
  gsap.to('.hero__content', { y: -80, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: '30% top', end: '80% top', scrub: true } });

  // The line-art robot is replaced by the 3D robot travelling in from the hero (three-scene.js).
  gsap.to('.techgrid', { backgroundPosition: '0px 240px', ease: 'none', scrollTrigger: { trigger: '.intro', start: 'top bottom', end: 'bottom top', scrub: true } });
}

// Capabilities: hover/focus expands the active column
const caps = [...document.querySelectorAll('[data-cap]')];
const activate = (cap) => caps.forEach((c) => c.classList.toggle('is-active', c === cap));
caps.forEach((c) => {
  c.addEventListener('pointerenter', () => activate(c));
  c.addEventListener('focus', () => activate(c));
  c.addEventListener('click', () => activate(c));
});

// Lesson dialog pauses smooth scroll
const dialog = document.querySelector('[data-lesson-dialog]');
new MutationObserver(() => (dialog.open ? site.lenis?.stop() : site.lenis?.start())).observe(dialog, { attributes: true, attributeFilter: ['open'] });

// Contact form
document.querySelector('[data-contact]').addEventListener('submit', (e) => {
  e.preventDefault();
  const f = e.target;
  const msg = f.querySelector('[data-contact-msg]');
  const ok = f.name.value.trim() && /^\S+@\S+\.\S+$/.test(f.email.value.trim()) && f.message.value.trim().length > 5;
  if (!ok) {
    msg.textContent = 'Add your name, a valid email and a short message so we can reply.';
    msg.className = 'form-msg is-error';
    return;
  }
  save('contact', { name: f.name.value, email: f.email.value, message: f.message.value, at: Date.now() });
  msg.textContent = `Thanks, ${f.name.value.trim().split(' ')[0]}. Message sent. An engineer will reply to ${f.email.value.trim()} within one working day.`;
  msg.className = 'form-msg is-ok';
  f.reset();
});
