import {
  renderSnapshots,
  defineSnapshots,
  registerSnapshotPlaceholders,
  refreshSnapshotImages,
} from "./stage.js";
import { loadGajjuAsset, createGajju, addGajjuStudio } from "./gajju-model.js";
import { getProduct } from "./data.js";
import { SHOT_DEFS, svgUrl, LOADING_LABEL } from "./product-shots.js";
import { onThemeChange } from "./theme.js";

/** Studio "photographs" rendered from the real GAJJU CAD model. Cached per page load. */
function buildGajjuScene(scene, asset) {
  addGajjuStudio(scene, { shadows: true, light: true });
  scene.userData.exposure = 1.0;
  scene.environmentIntensity = 0.7;
  const r = createGajju(asset, { shadows: true });
  scene.add(r.group);
  return r;
}

// Shot definitions (positions, alt text) live in product-shots.js, which has no Three.js.
const SHOTS = Object.fromEntries(
  Object.entries(SHOT_DEFS).map(([id, shots]) => [id, { asset: true, build: buildGajjuScene, shots }]),
);

const CHANGE = "nx:product-images";
/** Subscribe to "photos changed" (model loaded, or re-rendered for a new theme). */
export function onProductImagesChange(cb) {
  window.addEventListener(CHANGE, cb);
  const offTheme = onThemeChange(cb);
  return () => {
    window.removeEventListener(CHANGE, cb);
    offTheme();
  };
}

const loaded = {};
function placeholders(id, cfg) {
  if (cfg.failed) return cfg.failed;
  if (!cfg.placeholders) {
    cfg.placeholders = cfg.shots.map((_, i) =>
      svgUrl(LOADING_LABEL, `${id}-${i}`),
    );
    registerSnapshotPlaceholders(id, cfg.placeholders);
    loadGajjuAsset().then(
      (asset) => {
        loaded[id] = asset;
        defineSnapshots(id, (scene) => cfg.build(scene, asset), cfg.shots, 720);
        refreshSnapshotImages(id); // renders only the photos currently on the page
        window.dispatchEvent(new Event(CHANGE));
      },
      (err) => {
        console.error(err);
        cfg.failed = cfg.shots.map((_, i) =>
          svgUrl("GAJJU model failed to load", `${id}-${i}`),
        );
        window.dispatchEvent(new Event(CHANGE));
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
