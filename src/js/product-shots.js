// Product "photo" definitions and their loading placeholders. No Three.js here, so pages can show
// the placeholder straight away while product-images.js (the WebGL snapshot renderer) loads.
import { applyExplode } from "./robot-model.js";
import { getProduct } from "./data.js";

export const SHOT_DEFS = {
  // GAJJU is rendered from the real CAD model (async), in the navy product studio.
  GAJJU: [
    {
      position: [4.6, 2.5, 5.9],
      target: [0, 0.85, 0.15],
      alt: "three-quarter front view",
      setup: (r) => applyExplode(r.parts, 0),
    },
    {
      position: [7.4, 2.2, 0.4],
      target: [0, 0.85, 0.1],
      alt: "side profile",
      setup: (r) => applyExplode(r.parts, 0),
    },
    {
      position: [1.9, 2.0, 3.6],
      target: [0, 1.3, 0.7],
      alt: "head, trunk and gripper close-up",
      setup: (r) => applyExplode(r.parts, 0),
    },
    {
      position: [-4.4, 2.6, 5.6],
      target: [0, 0.85, 0.15],
      alt: "front view from the left",
      setup: (r) => applyExplode(r.parts, 0),
    },
  ],
  // The DIY kit leads with the exploded view: all the parts you build it from.
  "GAJJU-kit": [
    {
      position: [5.6, 3.9, 7.2],
      target: [0, 1.1, 0.3],
      alt: "all 104 parts in an exploded view",
      setup: (r) => applyExplode(r.parts, 1),
    },
    {
      position: [0.2, 7.4, 1.4],
      target: [0, 1.0, 0.2],
      alt: "parts laid out, seen from above",
      setup: (r) => applyExplode(r.parts, 1.2),
    },
    {
      position: [4.6, 2.5, 5.9],
      target: [0, 0.85, 0.15],
      alt: "the finished robot once built",
      setup: (r) => applyExplode(r.parts, 0),
    },
    {
      position: [1.9, 2.0, 3.6],
      target: [0, 1.3, 0.7],
      alt: "head, trunk and gripper close-up",
      setup: (r) => applyExplode(r.parts, 0),
    },
  ],
};

export const svgUrl = (label, i) =>
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 720"><!--${i}--><defs><radialGradient id="g" cx="50%" cy="45%"><stop offset="0" stop-color="#13233a"/><stop offset="1" stop-color="#060b13"/></radialGradient></defs><rect width="720" height="720" fill="url(#g)"/><text x="360" y="372" fill="#8fa3b8" font-family="Archivo, system-ui, sans-serif" font-size="26" text-anchor="middle">${label}</text></svg>`,
  );

export const LOADING_LABEL = "Loading GAJJU CAD model…";

/** The same images product-images.js shows before the model has loaded. */
export function placeholderImages(id, count = Infinity) {
  const shots = SHOT_DEFS[id];
  const product = getProduct(id);
  if (!shots || !product) return [];
  return shots.slice(0, Math.min(count, shots.length)).map((shot, i) => ({
    src: svgUrl(LOADING_LABEL, `${id}-${i}`),
    alt: `${product.name}, ${shot.alt}`,
  }));
}
