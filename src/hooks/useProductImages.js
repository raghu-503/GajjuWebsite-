import { useEffect, useReducer } from 'react';
import { placeholderImages } from '../js/product-shots.js';

// The snapshot renderer (Three.js + the GLB loader) is loaded on first use, not with the page.
// Until it arrives, the same "Loading…" placeholders it would show are returned synchronously.
let renderer = null;
let rendererPromise = null;
function loadRenderer() {
  rendererPromise ||= import('../js/product-images.js').then(
    (m) => (renderer = m),
    (err) => {
      rendererPromise = null; // allow a retry on the next mount
      throw err;
    },
  );
  return rendererPromise;
}

/** Product photos rendered from the 3D model; updates when the model loads or the theme changes. */
export function useProductImages(id, count = Infinity) {
  const [, rerender] = useReducer((n) => n + 1, 0);
  useEffect(() => {
    let off = null;
    let alive = true;
    loadRenderer().then(
      (m) => {
        if (!alive) return;
        off = m.onProductImagesChange(rerender);
        rerender(); // swap the placeholders for the renderer's images
      },
      (err) => console.error(err),
    );
    return () => {
      alive = false;
      off?.();
    };
  }, []);
  return renderer ? renderer.getProductImages(id, count) : placeholderImages(id, count);
}

export function useThumb(id) {
  return useProductImages(id, 1)[0]?.src || '';
}
