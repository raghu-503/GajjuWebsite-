// Section wrapper and heading block shared by the Gajju pages.
import { useId } from 'react';

/**
 * tone: "cream" | "paper" | "dark" (one dark band per page, per the brand guidelines).
 * `navSection` feeds the header's active-link highlight.
 */
export function Section({ id, tone = 'cream', navSection, labelledBy, className = '', children }) {
  return (
    <section
      id={id}
      className={`gj-section gj-section--${tone} ${className}`.trim()}
      data-nav-section={navSection}
      aria-labelledby={labelledBy}
    >
      <div className="gj-container">{children}</div>
    </section>
  );
}

/** Eyebrow + h2 + optional lead. Pass `id` and use it as the section's `labelledBy`. */
export function SectionHead({ id, eyebrow, title, lead, children }) {
  const fallbackId = useId();
  const headingId = id || fallbackId;
  return (
    <header className="gj-head" data-reveal>
      {eyebrow && <p className="gj-eyebrow">{eyebrow}</p>}
      <h2 className="gj-h2" id={headingId}>
        {title}
      </h2>
      {lead && <p className="gj-lead">{lead}</p>}
      {children}
    </header>
  );
}
