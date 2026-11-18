// Small browser checks shared by the 3D code and the animation code. Kept free of Three.js so
// modules that only need these (animations.js, loaded on every page) don't pull in the 3D bundle.
export const isMobile = () => window.matchMedia('(max-width: 768px), (pointer: coarse)').matches;
export const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
