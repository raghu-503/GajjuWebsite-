import * as THREE from "three";
import {
  renderSnapshots,
  defineSnapshots,
  registerSnapshotPlaceholders,
  refreshSnapshotImages,
} from "./stage.js";
import { applyExplode } from "./robot-model.js";
import { loadGajjuAsset, createGajju, addGajjuStudio } from "./gajju-model.js";
import { getProduct } from "./data.js";

/** Studio "photographs" rendered from the real GAJJU CAD model. Cached per page load. */
function buildGajjuScene(scene, asset) {
  addGajjuStudio(scene, { shadows: true, light: true });
  scene.userData.exposure = 1.0;
  scene.environmentIntensity = 0.7;
  const r = createGajju(asset, { shadows: true });
  scene.add(r.group);
  return r;
}

const SHOTS = {
  // GAJJU is rendered from the real CAD model (async), in the navy product studio.
  GAJJU: {
    asset: true,
    build: buildGajjuScene,
    shots: [
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
  },
  // The DIY kit leads with the exploded view: all the parts you build it from.
  "GAJJU-kit": {
    asset: true,
    build: buildGajjuScene,
    shots: [
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
  },
};

const svgUrl = (label, i) =>
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 720"><!--${i}--><defs><radialGradient id="g" cx="50%" cy="45%"><stop offset="0" stop-color="#13233a"/><stop offset="1" stop-color="#060b13"/></radialGradient></defs><rect width="720" height="720" fill="url(#g)"/><text x="360" y="372" fill="#8fa3b8" font-family="Archivo, system-ui, sans-serif" font-size="26" text-anchor="middle">${label}</text></svg>`,
  );

const loaded = {};
function placeholders(id, cfg) {
  if (!cfg.placeholders) {
    cfg.placeholders = cfg.shots.map((_, i) =>
      svgUrl("Loading GAJJU CAD model…", `${id}-${i}`),
    );
    registerSnapshotPlaceholders(id, cfg.placeholders);
    loadGajjuAsset().then(
      (asset) => {
        loaded[id] = asset;
        defineSnapshots(id, (scene) => cfg.build(scene, asset), cfg.shots, 720);
        refreshSnapshotImages(id); // renders only the photos currently on the page
      },
      (err) => {
        console.error(err);
        const failed = cfg.shots.map((_, i) =>
          svgUrl("GAJJU model failed to load", `${id}-${i}`),
        );
        document.querySelectorAll("img").forEach((img) => {
          const i = cfg.placeholders.indexOf(img.getAttribute("src"));
          if (i >= 0) img.setAttribute("src", failed[i]);
        });
      },
    );
  }
  return cfg.placeholders;
}

/**
 * Product photos. `count` limits how many shots are needed (cards and thumbnails need only the
 * first), so pages never render photos they don't show.
 */
export function getProductImages(id, count = Infinity) {
  const cfg = SHOTS[id];
  const product = getProduct(id);
  if (!cfg || !product) return [];
  const indices = [...Array(Math.min(count, cfg.shots.length)).keys()];
  const urls =
    cfg.asset && !loaded[id]
      ? placeholders(id, cfg)
      : renderSnapshots(
          id,
          cfg.asset ? (scene) => cfg.build(scene, loaded[id]) : cfg.build,
          cfg.shots,
          720,
          indices,
        );
  return indices.map((i) => ({
    src: urls[i],
    alt: `${product.name}, ${cfg.shots[i].alt}`,
  }));
}

export const getThumb = (id) => getProductImages(id, 1)[0]?.src || "";
export { THREE };
