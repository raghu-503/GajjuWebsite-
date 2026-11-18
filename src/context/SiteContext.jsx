import { createContext, useContext } from 'react';

/**
 * Site-wide state shared by the layout and pages:
 *   lenis        smooth-scroll instance (null with reduced motion)
 *   loaded       true once the intro loader has finished
 *   panel        name of the open panel ('menu' | 'cart' | 'search' | 'account') or null
 *   openPanel(name), closePanels(silent)
 *   go(to)       navigate with the page-curtain transition
 */
export const SiteContext = createContext(null);

export const useSite = () => useContext(SiteContext);
