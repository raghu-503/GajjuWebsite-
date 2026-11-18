import { defineConfig, loadEnv } from 'vite';
import { resolve } from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { SHOP_PATHS, PHASE2_PATHS, sitemapPaths } from './src/content/seo.js';
import { buildRobots, buildSitemap, siteUrlFrom } from './scripts/seo-files.mjs';

/**
 * Writes robots.txt (always) and sitemap.xml (only when VITE_SITE_URL is set: a sitemap needs
 * full URLs, and the production domain is not confirmed yet) into the build output.
 */
function seoFiles(env) {
  const siteUrl = siteUrlFrom(env.VITE_SITE_URL);
  const shopOn = env.VITE_ENABLE_SHOP === 'true';
  const phase2On = env.VITE_ENABLE_PHASE2 === 'true'; // For schools / For parents (config/features.js)
  return {
    name: 'gajju-seo-files',
    apply: 'build',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: buildRobots({ siteUrl, disallow: [...(shopOn ? [] : SHOP_PATHS), ...(phase2On ? [] : PHASE2_PATHS)] }),
      });
      if (siteUrl) {
        this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: buildSitemap(siteUrl, sitemapPaths({ phase2: phase2On })) });
      } else {
        this.warn('VITE_SITE_URL is not set: sitemap.xml, canonical links and og:url/og:image are skipped.');
      }
    },
  };
}

export default defineConfig(({ mode }) => {
  // .env files live in the project root (VITE_SITE_URL, VITE_ENABLE_SHOP, VITE_SHOW_PENDING, …).
  const env = loadEnv(mode, __dirname, 'VITE_');
  return {
    // Single-page React app: every route is served by src/index.html. Hosts need an SPA
    // fallback (serve index.html for unknown paths); `vite` and `vite preview` do this already.
    base: '/',
    plugins: [react(), tailwindcss(), seoFiles(env)],
    root: 'src',
    envDir: __dirname,
    publicDir: resolve(__dirname, 'public'),
    server: { port: 5173, open: true },
    build: {
      outDir: resolve(__dirname, 'dist'),
      emptyOutDir: true,
      // Pages and 3D code are split into chunks; the largest is the on-demand Three.js chunk
      // (~600 kB). Warn if any chunk grows past that, e.g. Three.js leaking into the entry again.
      chunkSizeWarningLimit: 650,
    },
  };
});
