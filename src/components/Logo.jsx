// Gajju logo (symbol + "Gajju"): DOC-brand-logo-files-v1, files in public/brand/logo/.
//   full-colour → Cream or Paper backgrounds (the main version)
//   reverse     → Ink or other dark backgrounds (Paper head, Saffron ears)
// Rules from the logo doc: clear space on every side = the height of the "G"; smallest size
// 24 px high on screen; never stretch, recolour or add effects. The SVGs are vector, with the
// wordmark already outlined, so no font is needed.
const SRC = {
  'full-colour': '/brand/logo/svg/gajju-logo-full-colour.svg',
  reverse: '/brand/logo/svg/gajju-logo-reverse.svg',
};
// The logo SVGs are 1533.44 × 412: width and height let the browser reserve the space.
const RATIO = 1533.44 / 412;

export default function Logo({ variant = 'full-colour', height = 32, className = '' }) {
  return (
    <img
      className={`gj-logo ${className}`.trim()}
      src={SRC[variant]}
      alt="Gajju"
      width={Math.round(height * RATIO)}
      height={height}
      decoding="async"
    />
  );
}
