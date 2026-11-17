// Line illustrations for each kit component (64×64, stroke = currentColor, accent = cyan).
const A = 'var(--cyan)';
export const COMPONENT_ICONS = {
  chassis: `<rect x="8" y="22" width="48" height="8" rx="2"/><rect x="8" y="40" width="48" height="8" rx="2"/><path d="M14 30v10M50 30v10" stroke="${A}"/><g fill="currentColor" stroke="none"><circle cx="20" cy="26" r="1.2"/><circle cx="28" cy="26" r="1.2"/><circle cx="36" cy="26" r="1.2"/><circle cx="44" cy="26" r="1.2"/></g>`,
  motor: `<rect x="10" y="24" width="24" height="16" rx="2"/><rect x="34" y="26" width="16" height="12" rx="6"/><path d="M50 32h6" stroke="${A}" stroke-width="2.4"/><path d="M14 40v6h6" />`,
  servo: `<rect x="12" y="22" width="40" height="22" rx="3"/><path d="M8 28h4M52 28h4"/><circle cx="24" cy="22" r="6" stroke="${A}"/><path d="M24 16v-6M18 10h12" stroke="${A}"/>`,
  driver: `<rect x="10" y="16" width="44" height="32" rx="2"/><g stroke="${A}"><path d="M18 24v16M23 24v16M28 24v16M33 24v16"/></g><rect x="40" y="22" width="8" height="8"/><path d="M40 40h8"/>`,
  mcu: `<rect x="8" y="18" width="48" height="28" rx="2"/><rect x="24" y="24" width="16" height="16" stroke="${A}"/><path d="M12 18v-4M18 18v-4M24 18v-4M30 18v-4M36 18v-4M42 18v-4M48 18v-4M12 46v4M18 46v4M24 46v4M30 46v4M36 46v4M42 46v4M48 46v4"/>`,
  sensor: `<rect x="8" y="22" width="48" height="20" rx="2"/><circle cx="22" cy="32" r="7"/><circle cx="42" cy="32" r="7"/><circle cx="22" cy="32" r="2.5" stroke="${A}"/><circle cx="42" cy="32" r="2.5" stroke="${A}"/><path d="M28 46v6M36 46v6"/>`,
  wheel: `<circle cx="32" cy="32" r="20"/><circle cx="32" cy="32" r="13"/><circle cx="32" cy="32" r="4" stroke="${A}"/><path d="M32 19v9M32 36v9M19 32h9M36 32h9"/>`,
  wires: `<path d="M8 20c14 0 14 24 28 24s12-20 20-20"/><path d="M8 30c12 0 16 18 30 18" stroke="${A}"/><path d="M8 40c10 0 18-22 30-22s12 8 18 8"/><rect x="4" y="17" width="5" height="6"/><rect x="4" y="27" width="5" height="6"/><rect x="4" y="37" width="5" height="6"/>`,
  battery: `<rect x="10" y="20" width="40" height="24" rx="3"/><path d="M50 28h4v8h-4"/><path d="M30 24l-6 9h8l-6 9" stroke="${A}" stroke-linejoin="round"/>`,
  screws: `<path d="M14 14h12M20 14v28l-3 4h6l-3-4"/><path d="M17 20h6M17 26h6M17 32h6"/><polygon points="44,20 50,24 50,31 44,35 38,31 38,24" stroke="${A}"/><circle cx="44" cy="27.5" r="2.5"/><rect x="34" y="42" width="20" height="6" rx="1"/>`,
  leg: `<path d="M26 8h14v14l-6 4z"/><circle cx="33" cy="26" r="4" stroke="${A}"/><path d="M31 30l-6 16h8l4-14"/><path d="M22 46h14l3 8H20z"/>`,
  head: `<path d="M18 18h28a4 4 0 0 1 4 4v18a4 4 0 0 1-4 4H18a4 4 0 0 1-4-4V22a4 4 0 0 1 4-4z"/><path d="M14 24H8v12h6M50 24h6v12h-6"/><rect x="24" y="26" width="16" height="6" rx="3" stroke="${A}"/><path d="M28 44v8h8v-8"/>`,
  gripper: `<path d="M12 32h16"/><circle cx="30" cy="32" r="5" stroke="${A}"/><path d="M34 29l10-10h8v6l-8 5M34 35l10 10h8v-6l-8-5"/>`,
  camera: `<rect x="10" y="18" width="44" height="30" rx="3"/><circle cx="32" cy="33" r="9"/><circle cx="32" cy="33" r="4" stroke="${A}"/><path d="M16 48v6M22 48v6M42 48v6M48 48v6"/>`,
  speaker: `<circle cx="32" cy="32" r="20"/><circle cx="32" cy="32" r="11" stroke="${A}"/><circle cx="32" cy="32" r="3"/>`,
  manual: `<path d="M12 14h18a4 4 0 0 1 4 4v32a3 3 0 0 0-3-3H12z"/><path d="M52 14H38a4 4 0 0 0-4 4v32a3 3 0 0 1 3-3h15z"/><path d="M16 22h12M16 28h10M38 22h10" /><path d="M38 30l4 4 6-8" stroke="${A}"/>`,
};

export const componentIcon = (key) =>
  `<svg class="comp-icon" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true">${COMPONENT_ICONS[key] || ''}</svg>`;
