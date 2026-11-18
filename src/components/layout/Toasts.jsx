import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Icon from '../Icon.jsx';
import { onToast } from '../../js/toast.js';
import { gsap } from '../../js/animations.js';

function Toast({ toast, onDone }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const el = ref.current;
    gsap.fromTo(el, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: 'power3.out' });
    const id = setTimeout(() => gsap.to(el, { y: -10, opacity: 0, duration: 0.3, onComplete: onDone }), 2600);
    return () => {
      clearTimeout(id);
      gsap.killTweensOf(el);
    };
  }, [onDone]);
  return (
    <div className="toast" ref={ref}>
      <Icon name={toast.icon} />
      <span>{toast.message}</span>
    </div>
  );
}

export default function Toasts() {
  const [list, setList] = useState([]);
  const done = useRef(new Map());
  useEffect(() => onToast((t) => setList((l) => [...l, t])), []);
  const onDoneFor = (id) => {
    if (!done.current.has(id)) done.current.set(id, () => {
      done.current.delete(id);
      setList((l) => l.filter((t) => t.id !== id));
    });
    return done.current.get(id);
  };
  return (
    <div className="toasts" aria-live="polite">
      {list.map((t) => (
        <Toast key={t.id} toast={t} onDone={onDoneFor(t.id)} />
      ))}
    </div>
  );
}
