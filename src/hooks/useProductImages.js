import { useEffect, useReducer } from 'react';
import { getProductImages, onProductImagesChange } from '../js/product-images.js';

/** Product photos rendered from the 3D model; updates when the model loads or the theme changes. */
export function useProductImages(id, count = Infinity) {
  const [, rerender] = useReducer((n) => n + 1, 0);
  useEffect(() => onProductImagesChange(rerender), []);
  return getProductImages(id, count);
}

export function useThumb(id) {
  return useProductImages(id, 1)[0]?.src || '';
}
