// Small brand labels used across the Gajju pages.

/**
 * Review mode: show unconfirmed content (the content document's "[…]" blanks), placeholders and
 * engineering notes, clearly marked. On in development (`npm run dev`) and in review builds made
 * with VITE_SHOW_PENDING=true. OFF in normal production builds, so visitors never see them.
 */
export const SHOW_PENDING = import.meta.env.DEV || import.meta.env.VITE_SHOW_PENDING === 'true';

/**
 * Status label. tone: "done" (Teal), "planned" (Peach: planned, coming, being written) or
 * "awaiting" (outlined: waiting for information we don't have yet).
 */
export function StatusLabel({ tone = 'planned', children }) {
  return <span className={`gj-status gj-status--${tone}`}>{children}</span>;
}

/** "Render" / "Simulation" label shown on the picture or video itself. */
export function MediaLabel({ children }) {
  return <span className="gj-media-label">{children}</span>;
}

/**
 * A "[…]" blank from the content document: text that isn't confirmed yet. In review mode it is
 * shown with a dashed underline and a note; otherwise it is replaced by `fallback` (default:
 * nothing).
 */
export function Pending({ note, children, fallback = null }) {
  if (!SHOW_PENDING) return fallback;
  return (
    <span className="gj-pending" data-pending="">
      {children}
      {note && <span className="gj-pending__note">({note})</span>}
    </span>
  );
}
