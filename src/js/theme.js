// Light (cream) is the default theme; visitors can switch to dark and the choice is remembered.
// The initial theme is applied by a tiny inline script in index.html's <head> to avoid a flash.
import { save } from './storage.js';

const KEY = 'theme';
const EVENT = 'nx:themechange';
const META_COLOR = { light: '#F6EFE3', dark: '#05070a' }; // light = brand Cream (logo doc favicon snippet)

/** Colours used inside the Three.js scenes, per theme. */
export const SCENE_COLORS = {
  light: {
    fog: 0xf4efe5,
    disc: 0xe6dfd0,
    grid: 0xc9cfdc,
    snapBg: 0xf4efe5,
    particle: 0x2f6bff,
    halo: 0x0b7f94,
    additive: false,
  },
  dark: {
    fog: 0x05070a,
    disc: 0x070a10,
    grid: 0x16314f,
    snapBg: 0x090c11,
    particle: 0x7fe9ff,
    halo: 0x3de8ff,
    additive: true,
  },
};

export const getTheme = () => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');
export const sceneColors = () => SCENE_COLORS[getTheme()];

export function setTheme(theme) {
  const t = theme === 'dark' ? 'dark' : 'light';
  document.documentElement.dataset.theme = t;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', META_COLOR[t]);
  save(KEY, t);
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { theme: t } }));
}

/** Subscribe to theme changes. Returns an unsubscribe function. */
export function onThemeChange(cb) {
  const handler = (e) => cb(e.detail.theme);
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}

/**
 * The Gajju brand is light-only (Cream background; "pure white or dark-mode-only pages" are a
 * don't), so the site always starts light and there is no theme switch. A dark choice saved by
 * the old switch is ignored. setTheme() stays for the 3D scenes' theme hooks.
 */
export function initTheme() {
  document.documentElement.dataset.theme = 'light';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', META_COLOR.light);
}
