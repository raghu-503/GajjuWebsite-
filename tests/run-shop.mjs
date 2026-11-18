// npm run test:shop — keeps the Phase 4 shop verified while it is hidden from the site.
// Builds a separate copy with the shop switched on (VITE_ENABLE_SHOP=true) into dist-shop/,
// then runs the browser smoke test against it with the shop checks enabled.
// The normal build (dist/) is not touched.
import { spawnSync } from 'node:child_process';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const env = { ...process.env, VITE_ENABLE_SHOP: 'true' };
const run = (args, extraEnv = {}) =>
  spawnSync(process.execPath, args, { cwd: ROOT, stdio: 'inherit', env: { ...env, ...extraEnv } }).status;

const built = run([join(ROOT, 'node_modules/vite/bin/vite.js'), 'build', '--outDir', join(ROOT, 'dist-shop')]);
if (built !== 0) process.exit(built ?? 1);
process.exit(run([join(ROOT, 'tests/browser-smoke.mjs')], { TEST_SHOP: '1', TEST_DIST: 'dist-shop', TEST_PORT: process.env.TEST_PORT || '4280' }) ?? 1);
