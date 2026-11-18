import { useCallback } from 'react';
import { addToCart } from '../js/cart.js';
import { useSite } from '../context/SiteContext.jsx';

/** Adds a product and (by default) slides the cart drawer open, like the old [data-add-to-cart]. */
export function useAddToCart() {
  const { openPanel } = useSite();
  return useCallback(
    (id, qty = 1, { openCart = true } = {}) => {
      addToCart(id, qty);
      if (openCart) setTimeout(() => openPanel('cart'), 150);
    },
    [openPanel],
  );
}
