// Shared layout for the policy pages (Privacy, Terms): one title, a short introduction and
// numbered sections. Content and the outstanding legal requirements: content/policies.js.
import { useRef } from 'react';
import { Section } from './Section.jsx';
import { PageHero } from './PageParts.jsx';
import { usePageMeta } from '../../hooks/usePageMeta.js';

function Block({ block }) {
  if (block.list) {
    return (
      <ul>
        {block.list.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    );
  }
  if (block.quote) return <blockquote className="gj-policy__quote">{block.quote}</blockquote>;
  return <p>{block.p}</p>;
}

export default function PolicyPage({ policy, path }) {
  usePageMeta(path);
  const mainRef = useRef(null);

  return (
    <main id="main" className="gj" ref={mainRef}>
      <PageHero title={policy.title} lead={policy.intro[0]} />

      <Section id="policy" tone="paper" labelledBy="top-title">
        <div className="gj-policy">
          {policy.intro.slice(1).map((p) => (
            <p className="gj-policy__intro" key={p}>
              {p}
            </p>
          ))}

          {policy.sections.map((s, i) => (
            <section className="gj-policy__section" id={s.id} key={s.id} aria-labelledby={`${s.id}-title`}>
              <h2 className="gj-h3" id={`${s.id}-title`}>
                <span className="gj-policy__num">{i + 1}.</span> {s.title}
              </h2>
              {s.blocks.map((b, j) => (
                <Block block={b} key={j} />
              ))}
            </section>
          ))}

          {policy.note && <p className="gj-caption">{policy.note}</p>}
        </div>
      </Section>
    </main>
  );
}
