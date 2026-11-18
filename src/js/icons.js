// Icons for the few toolbars that Three.js modules build imperatively (gajju-viewer.js).
// React components use lucide-react through components/Icon.jsx instead.
import { createIcons, Box, Boxes, RotateCcw, RefreshCw, X } from 'lucide';

const ICONS = { Box, Boxes, RotateCcw, RefreshCw, X };

/** Replace any <i data-lucide="name"> in the document with inline SVG. */
export function refreshIcons() {
  createIcons({ icons: ICONS, attrs: { 'stroke-width': 1.6 } });
}
