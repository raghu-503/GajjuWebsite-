import { Fragment, forwardRef } from 'react';

/**
 * Headline split into masked words (`.w > span`) for the word-by-word reveal.
 * `\n` in the text becomes a line break. `reveal="auto"` animates on scroll (see initReveals);
 * `reveal="manual"` leaves the timing to the caller (the hero title waits for the loader).
 */
const SplitText = forwardRef(function SplitText({ as: Tag = 'h2', text, reveal = 'auto', ...rest }, ref) {
  const lines = text.split('\n');
  return (
    <Tag ref={ref} data-split={reveal} aria-label={text.replace(/\s+/g, ' ').trim()} {...rest}>
      {lines.map((line, li) => (
        <Fragment key={li}>
          {li > 0 && <br />}
          {line
            .trim()
            .split(/\s+/)
            .map((word, wi) => (
              <Fragment key={wi}>
                {wi > 0 && ' '}
                <span className="w" aria-hidden="true">
                  <span>{word}</span>
                </span>
              </Fragment>
            ))}
        </Fragment>
      ))}
    </Tag>
  );
});

export default SplitText;
