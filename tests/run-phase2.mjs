// npm run test:phase2 — keeps the hidden Phase 2 pages (For schools, For parents) verified.
// Builds a separate copy with Phase 2 switched on (VITE_ENABLE_PHASE2=true) into dist-phase2/,
// then runs the browser smoke test against it with the Phase 2 checks enabled.
// The normal build (dist/) is not touched.
import { spawnSync } from 'node:child_process';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const env = { ...process.env, VITE_ENABLE_PHASE2: 'true' };
const run = (args, extraEnv = {}) =>
  spawnSync(process.execPath, args, { cwd: ROOT, stdio: 'inherit', env: { ...env, ...extraEnv } }).status;

const built = run([join(ROOT, 'node_modules/vite/bin/vite.js'), 'build', '--outDir', join(ROOT, 'dist-phase2')]);
if (built !== 0) process.exit(built ?? 1);
process.exit(run([join(ROOT, 'tests/browser-smoke.mjs')], { TEST_PHASE2: '1', TEST_DIST: 'dist-phase2', TEST_PORT: process.env.TEST_PORT || '4380' }) ?? 1);
