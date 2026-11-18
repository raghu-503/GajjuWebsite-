import { COMPONENT_ICONS } from '../js/component-icons.js';

/** Line illustration for a kit component (static SVG paths from component-icons.js). */
export default function ComponentIcon({ icon }) {
  return (
    <svg
      className="comp-icon"
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: COMPONENT_ICONS[icon] || '' }}
    />
  );
}
