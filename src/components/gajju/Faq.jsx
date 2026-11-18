// FAQ as native <details> elements: keyboard and screen-reader friendly with no script.
import { Pending } from './Labels.jsx';

export default function Faq({ items }) {
  return (
    <div className="gj-faq">
      {items.map((item) => (
        <details key={item.q}>
          <summary>{item.q}</summary>
          <div>
            <p>
              {item.a}
              {item.pending && (
                <>
                  {' '}
                  <Pending note={item.pending.note}>{item.pending.text}</Pending>
                </>
              )}
              {item.after && <> {item.after}</>}
            </p>
          </div>
        </details>
      ))}
    </div>
  );
}
