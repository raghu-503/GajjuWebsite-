// Builds robots.txt and sitemap.xml text. Used by the Vite build (vite.config.js) and the tests.

const escapeXml = (s) => s.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c]);

/** Normalises a configured site URL ("https://x.org/" → "https://x.org"); null if not set or invalid. */
export function siteUrlFrom(value) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (!['https:', 'http:'].includes(url.protocol)) return null;
    return url.origin + url.pathname.replace(/\/+$/, '');
  } catch {
    return null;
  }
}

/** robots.txt: everything crawlable except `disallow` paths; Sitemap line only with a site URL. */
export function buildRobots({ siteUrl = null, disallow = [] } = {}) {
  const lines = ['User-agent: *', 'Allow: /', ...disallow.map((p) => `Disallow: ${p}`)];
  if (siteUrl) lines.push('', `Sitemap: ${siteUrl}/sitemap.xml`);
  return lines.join('\n') + '\n';
}

/** sitemap.xml for the given paths. A sitemap needs full URLs, so a site URL is required. */
export function buildSitemap(siteUrl, paths) {
  if (!siteUrl) throw new Error('buildSitemap needs a site URL');
  const urls = paths.map((p) => `  <url>\n    <loc>${escapeXml(siteUrl + (p === '/' ? '/' : p))}</loc>\n  </url>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
}
