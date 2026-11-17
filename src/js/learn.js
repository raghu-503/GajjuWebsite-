import { LESSONS } from './data.js';
import { load, save } from './storage.js';
import { refreshIcons } from './icons.js';
import { gsap } from './animations.js';

// Small technical illustrations, one per lesson.
const ART = {
  start: `<circle cx="60" cy="60" r="34"/><circle cx="60" cy="60" r="4" class="a"/><path d="M60 26v-10M94 60h10M60 94v10M26 60H16"/><path class="a spin" d="M60 60 82 38"/><path d="M42 60a18 18 0 0 1 18-18" class="a"/>`,
  sensors: `<path d="M28 60h12"/><rect x="18" y="48" width="10" height="24" rx="2"/><path class="a wave" d="M46 44a22 22 0 0 1 0 32"/><path class="a wave w2" d="M56 36a34 34 0 0 1 0 48"/><path class="a wave w3" d="M66 28a46 46 0 0 1 0 64"/><rect x="96" y="40" width="8" height="40"/>`,
  motors: `<path d="M12 80h12V40h12v40h12V40h12v40h12V40h12v40h12V40h12" class="a"/><path d="M12 96h96"/><path d="M12 24h96" stroke-dasharray="3 5"/>`,
  mcu: `<rect x="36" y="36" width="48" height="48" rx="4"/><rect x="50" y="50" width="20" height="20" class="a"/><path d="M44 36V24M56 36V24M68 36V24M80 36V24M44 84v12M56 84v12M68 84v12M80 84v12M36 44H24M36 56H24M36 68H24M84 44h12M84 56h12M84 68h12"/>`,
  assembly: `<rect x="22" y="70" width="76" height="8" rx="2"/><rect x="22" y="40" width="76" height="8" rx="2" class="a lift"/><path d="M30 48v22M90 48v22"/><circle cx="34" cy="90" r="10"/><circle cx="86" cy="90" r="10"/>`,
  projects: `<path d="M16 92c20-40 40 10 58-30s20-30 30-36" class="a draw"/><circle cx="16" cy="92" r="4"/><circle cx="104" cy="26" r="4" class="a"/><path d="M16 104h92M16 16v88" stroke-dasharray="2 4"/>`,
};

export function initLearn(root) {
  const grid = root.querySelector('[data-lessons]');
  const dialog = document.querySelector('[data-lesson-dialog]');
  const progress = load('lessons', {});
  const pct = (l) => Math.round(((progress[l.id] || []).filter(Boolean).length / l.points.length) * 100);

  const render = () => {
    grid.innerHTML = LESSONS.map(
      (l, i) => `<button type="button" class="lesson ${i === 0 ? 'lesson--wide' : ''}" data-lesson="${l.id}" data-reveal>
        <span class="lesson__art" aria-hidden="true"><svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">${ART[l.id]}</svg></span>
        <span class="lesson__meta"><span class="pill">${l.level}</span><span class="lesson__mins"><i data-lucide="clock"></i>${l.mins} min</span></span>
        <span class="lesson__title">${l.title}</span>
        <span class="lesson__sum">${l.summary}</span>
        <span class="lesson__progress"><span style="width:${pct(l)}%"></span></span>
        <span class="lesson__cta">${pct(l) === 100 ? 'Completed, review lesson' : pct(l) > 0 ? `Continue, ${pct(l)}% done` : 'Open lesson'}</span>
      </button>`
    ).join('');
    refreshIcons();
  };

  const open = (id) => {
    const l = LESSONS.find((x) => x.id === id);
    const done = progress[id] || [];
    dialog.innerHTML = `
      <div class="ld">
        <button class="icon-btn ld__close" data-ld-close aria-label="Close lesson"><i data-lucide="x"></i></button>
        <div class="ld__art" aria-hidden="true"><svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">${ART[l.id]}</svg></div>
        <div class="ld__body">
          <div class="ld__pills"><span class="pill">${l.level}</span><span class="pill">${l.mins} min</span></div>
          <h3 id="lesson-title">${l.title}</h3>
          <p>${l.summary}</p>
          <h4>Lesson outline</h4>
          <ol class="ld__steps">${l.points
            .map((p, i) => `<li><label><input type="checkbox" data-point="${i}" ${done[i] ? 'checked' : ''}/><span>${p}</span></label></li>`)
            .join('')}</ol>
          <p class="muted ld__note">Tick each part as you finish it. Progress is saved in this browser.</p>
          <div class="ld__actions">
            <button class="btn btn--primary" data-ld-all>Mark lesson complete</button>
            <button class="btn btn--ghost" data-ld-close>Close</button>
          </div>
        </div>
      </div>`;
    refreshIcons();
    dialog.showModal();
    gsap.fromTo(dialog, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power3.out' });
    const persist = () => {
      progress[id] = [...dialog.querySelectorAll('[data-point]')].map((c) => c.checked);
      save('lessons', progress);
      render();
      grid.querySelectorAll('[data-reveal]').forEach((el) => (el.style.opacity = 1));
    };
    dialog.onchange = persist;
    dialog.onclick = (e) => {
      if (e.target === dialog || e.target.closest('[data-ld-close]')) dialog.close();
      if (e.target.closest('[data-ld-all]')) {
        dialog.querySelectorAll('[data-point]').forEach((c) => (c.checked = true));
        persist();
        dialog.close();
      }
    };
  };

  render();
  grid.addEventListener('click', (e) => {
    const b = e.target.closest('[data-lesson]');
    if (b) open(b.dataset.lesson);
  });
}
