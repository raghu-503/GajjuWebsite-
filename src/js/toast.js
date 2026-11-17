import gsap from 'gsap';
import { refreshIcons } from './icons.js';

export function toast(message, icon = 'check') {
  const wrap = document.querySelector('[data-toasts]');
  if (!wrap) return;
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `<i data-lucide="${icon}"></i><span>${message}</span>`;
  wrap.appendChild(el);
  refreshIcons();
  gsap.fromTo(el, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: 'power3.out' });
  setTimeout(() => gsap.to(el, { y: -10, opacity: 0, duration: 0.3, onComplete: () => el.remove() }), 2600);
}
