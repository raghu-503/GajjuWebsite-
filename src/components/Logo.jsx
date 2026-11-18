export default function Logo() {
  return (
    <svg className="logo-mark" viewBox="0 0 40 40" aria-hidden="true">
      <path
        className="logo-mark__frame"
        d="M20 2.5 35.2 11.25v17.5L20 37.5 4.8 28.75v-17.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        className="logo-mark__n"
        d="M25.5 15.2A7 7 0 1 0 27 20.5H20.5"
        fill="none"
        style={{ stroke: 'var(--cyan)' }}
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle className="logo-mark__dot" cx="27" cy="13" r="2.2" style={{ fill: 'var(--cyan)' }} />
    </svg>
  );
}
