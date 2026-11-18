// Browser smoke test for the built site (dist/).
//
// Starts `vite preview`, opens headless Chrome over the DevTools protocol (no extra npm
// packages), walks the main routes and flows, and fails on any failed check or any console
// error, warning or uncaught exception.
//
//   npm run build && npm run test:browser      (or simply: npm test)
//
// Env: CHROME_PATH (if Chrome isn't found automatically), TEST_PORT (default 4180),
//      TEST_DIST (build folder, default dist), TEST_SHOP=1 (the build has the Phase 4 shop on;
//      set by `npm run test:shop`, which builds dist-shop with VITE_ENABLE_SHOP=true).
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.TEST_PORT || 4180);
const DEBUG_PORT = PORT + 1000;
const BASE = `http://localhost:${PORT}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const DIST = process.env.TEST_DIST || 'dist';
const SHOP = process.env.TEST_SHOP === '1';

if (!existsSync(join(ROOT, DIST, 'index.html'))) {
  console.error(`${DIST}/ not found. Run "npm run build" first (or use "npm test").`);
  process.exit(1);
}

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, 'Google/Chrome/Application/chrome.exe'),
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ];
  return candidates.find((p) => p && existsSync(p));
}

const chromePath = findChrome();
if (!chromePath) {
  console.error('Chrome/Edge not found. Set CHROME_PATH to a Chromium-based browser.');
  process.exit(1);
}

/* ---------- start the preview server and the browser ---------- */
const server = spawn(
  process.execPath,
  [join(ROOT, 'node_modules/vite/bin/vite.js'), 'preview', '--port', String(PORT), '--strictPort', '--outDir', join(ROOT, DIST)],
  { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] },
);
let serverLog = '';
server.stdout.on('data', (d) => (serverLog += d));
server.stderr.on('data', (d) => (serverLog += d));

const profile = mkdtempSync(join(tmpdir(), 'gajju-smoke-'));
let chrome;

function cleanup() {
  try { chrome?.kill(); } catch {}
  try { server.kill(); } catch {}
  // Chrome may still hold the profile for a moment after kill().
  setTimeout(() => { try { rmSync(profile, { recursive: true, force: true }); } catch {} }, 500);
}

async function waitForHttp(url, ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    try { if ((await fetch(url)).ok) return; } catch {}
    await sleep(200);
  }
  throw new Error(`Timed out waiting for ${url}\n${serverLog}`);
}

let failures = 0;
let ws;
try {
  await waitForHttp(BASE + '/', 20000);

  chrome = spawn(chromePath, [
    '--headless=new', `--remote-debugging-port=${DEBUG_PORT}`, '--no-first-run',
    '--no-default-browser-check', '--window-size=1400,900', `--user-data-dir=${profile}`, 'about:blank',
  ], { stdio: 'ignore' });

  let targets;
  for (let i = 0; i < 75 && !targets; i++) {
    try { targets = await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json`)).json(); } catch { await sleep(200); }
  }
  if (!targets) throw new Error('Could not connect to Chrome DevTools.');
  const pageTarget = targets.find((t) => t.type === 'page');

  /* ---------- tiny CDP client ---------- */
  ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let seq = 0;
  const pending = new Map();
  const consoleErrors = [];
  ws.onmessage = (m) => {
    const msg = JSON.parse(m.data);
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); return; }
    if (msg.method === 'Runtime.exceptionThrown') {
      const d = msg.params.exceptionDetails;
      consoleErrors.push('exception: ' + (d.exception?.description || d.text));
    }
    if (msg.method === 'Runtime.consoleAPICalled' && ['error', 'warning', 'assert'].includes(msg.params.type)) {
      consoleErrors.push(`console.${msg.params.type}: ` + msg.params.args.map((a) => a.value ?? a.description).join(' '));
    }
    if (msg.method === 'Log.entryAdded' && msg.params.entry.level === 'error') {
      consoleErrors.push('log: ' + msg.params.entry.text + (msg.params.entry.url ? ` (${msg.params.entry.url})` : ''));
    }
  };
  const send = (method, params = {}) =>
    new Promise((r) => { const id = ++seq; pending.set(id, r); ws.send(JSON.stringify({ id, method, params })); });
  const ev = async (expression) => {
    const res = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (res.result?.exceptionDetails) throw new Error('Evaluation failed: ' + (res.result.exceptionDetails.exception?.description || expression));
    return res.result?.result?.value;
  };
  /** Poll a boolean page expression until it is true. */
  const waitFor = async (expression, label, ms = 15000) => {
    const end = Date.now() + ms;
    while (Date.now() < end) {
      try { if (await ev(`!!(${expression})`)) return; } catch {}
      await sleep(150);
    }
    throw new Error(`Timed out waiting for: ${label}`);
  };
  const goto = async (path, readyExpr, label) => {
    await send('Page.navigate', { url: BASE + path });
    await waitFor(`document.readyState === 'complete'`, `${path} to load`);
    await waitFor(readyExpr, label || `${path} to render`);
  };
  /** Set an input's value the way React notices (native setter + input event). */
  const setValue = (sel, value) => ev(`(() => {
    const el = document.querySelector(${JSON.stringify(sel)});
    const proto = Object.getPrototypeOf(el);
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, ${JSON.stringify(value)});
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  })()`);

  await send('Runtime.enable');
  await send('Page.enable');
  await send('Log.enable');

  async function test(name, fn) {
    const before = consoleErrors.length;
    try {
      const note = await fn();
      const errs = consoleErrors.slice(before);
      if (errs.length) throw new Error('console errors:\n      ' + errs.join('\n      '));
      console.log(`  ✓ ${name}${note ? `  (${note})` : ''}`);
    } catch (e) {
      failures++;
      console.log(`  ✗ ${name}\n      ${String(e.message || e).split('\n').join('\n      ')}`);
    }
  }
  const expect = (cond, msg) => { if (!cond) throw new Error(msg); };
  let skipped = 0;
  /** Phase 4 shop checks: run on the shop build (npm run test:shop), skipped on the default build. */
  async function shopTest(name, fn) {
    if (SHOP) return test(name, fn);
    skipped++;
    console.log(`  - ${name}  (shop off in this build: skipped; see npm run test:shop)`);
  }

  console.log(`Smoke test against ${BASE} using ${chromePath}\n`);

  // Start every run with an empty cart / saved state.
  await goto('/', `document.querySelector('#root')?.children.length`);
  await ev(`localStorage.clear()`);

  /* ---------- routes ---------- */
  await test('/ (home) renders its sections in document order, with one dark band', async () => {
    await goto('/', `document.querySelector('#gj-hero-title')`, 'hero headline');
    const r = await ev(`({
      h1: document.querySelector('main h1').textContent.trim(),
      sections: [...document.querySelectorAll('main > section')].map((s) => s.id),
      dark: document.querySelectorAll('main .gj-section--dark').length,
      header: !!document.querySelector('header'), footer: !!document.querySelector('footer'),
      prices: /₹|INR/.test(document.querySelector('main').textContent),
      caps: /GAJJU/.test(document.querySelector('main').textContent),
    })`);
    // Section 6 (build steps) is hidden until the mechanical engineer supplies the steps.
    const ORDER = ['top', 'does', 'open-design', 'learn', 'explore', 'safety', 'about', 'founding', 'join'];
    expect(r.h1 === 'Physical AI you can build.', `unexpected h1: ${r.h1}`);
    expect(JSON.stringify(r.sections) === JSON.stringify(ORDER), `section order: ${r.sections.join(', ')}`);
    expect(r.dark === 1, `expected exactly one dark band, found ${r.dark}`);
    expect(r.header && r.footer, 'header or footer missing');
    expect(!r.prices, 'a price is shown on the Home page');
    expect(!r.caps, '"GAJJU" in capitals appears in the page text');
    return `${r.sections.length} sections, 1 dark band`;
  });

  /* ---------- 3D experience (loaded on demand) ---------- */
  const loadedScripts = (re) => ev(`performance.getEntriesByType('resource').map((e) => e.name).filter((n) => ${re}.test(n)).length`);
  const GLB = '/gajju2_robot\\.glb/';

  await test('home: hero plays the walking loop, labelled Simulation, with a pause button', async () => {
    await goto('/', `document.querySelector('.gj-hero__media video')`);
    await waitFor(`(() => { const v = document.querySelector('.gj-hero__media video'); return v.readyState >= 2 && !v.paused && v.currentTime > 0; })()`, 'hero video playing', 20000);
    const r = await ev(`(() => {
      const f = document.querySelector('.gj-hero__media'); const v = f.querySelector('video');
      return { label: f.querySelector('figcaption').textContent, muted: v.muted, loop: v.loop, src: v.currentSrc.replace(location.origin, ''), poster: v.getAttribute('poster'), canvases: f.querySelectorAll('canvas').length };
    })()`);
    expect(/^simulation$/i.test(r.label), `hero video not labelled as a simulation: ${r.label}`);
    expect(r.muted && r.loop, 'hero video should be a muted loop');
    expect(/^\/media\/DOC-website-hero-loop-v2\.(webm|mp4)$/.test(r.src) && r.poster === '/media/DOC-website-hero-poster-v2.jpg', `video files: ${r.src} ${r.poster}`);
    expect(r.canvases === 0, 'a 3D canvas is still in the hero');
    // WCAG 2.2.2: moving content longer than 5 s can be paused.
    await ev(`document.querySelector('.gj-hero__toggle').click()`);
    await waitFor(`document.querySelector('.gj-hero__media video').paused && document.querySelector('.gj-hero__toggle').getAttribute('aria-label') === 'Play the video'`, 'video paused by the button');
    await ev(`document.querySelector('.gj-hero__toggle').click()`);
    await waitFor(`!document.querySelector('.gj-hero__media video').paused`, 'video playing again');
    expect((await loadedScripts('/robot-explorer-/')) === 0 && (await loadedScripts(GLB)) === 0, '3D code or model loaded before scrolling to the viewer');
    return `${r.src}, pause/play works`;
  });

  await test('home: 3D viewer loads near the viewport, friendly names only, one renderer, GLB once', async () => {
    await ev(`document.querySelector('#explore').scrollIntoView()`);
    await waitFor(`document.querySelectorAll('.gj-groups button').length === 8`, 'viewer part groups', 30000);
    await ev(`document.querySelectorAll('.gj-groups button')[6].click()`);
    await waitFor(`document.querySelector('.gj-part h3').textContent.trim() === document.querySelectorAll('.gj-groups button')[6].textContent.trim()`, 'group selection');
    await ev(`[...document.querySelectorAll('.gj-viewer__tools button')].at(-1).click()`); // reset view
    await sleep(1500);
    // Tap the model: try points around the stage centre until a part is picked.
    const box = await ev(`(() => { const r = document.querySelector('.gj-viewer__stage canvas').getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; })()`);
    let part = null;
    for (const [fx, fy] of [[0.5, 0.5], [0.45, 0.45], [0.55, 0.55], [0.5, 0.4], [0.4, 0.55]]) {
      const x = box.x + box.w * fx;
      const y = box.y + box.h * fy;
      for (const type of ['mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 });
      await sleep(700);
      part = await ev(`(() => { const i = document.querySelector('.gj-part__idx').textContent; return i.startsWith('Part of:') ? { idx: i, name: document.querySelector('.gj-part h3').textContent } : null; })()`);
      if (part) break;
    }
    expect(part, 'tapping the model did not select a part');
    expect(!/^REF-|-v\d+$/.test(part.name), `CAD name shown: ${part.name}`);
    expect(await ev(`[...document.querySelectorAll('.gj-viewer__tools button')].every((b) => !b.disabled)`), 'viewer controls still disabled');
    const r = await ev(`({ hero: document.querySelectorAll('.gj-hero__media canvas').length, viewer: document.querySelectorAll('.gj-viewer__stage canvas').length })`);
    expect(r.hero === 0 && r.viewer === 1, `duplicate or missing renderers: ${JSON.stringify(r)}`);
    const glbFetches = await loadedScripts(GLB);
    expect(glbFetches === 1, `GLB requested ${glbFetches} times`);
    return `picked "${part.name}" (${part.idx}), GLB fetched once`;
  });

  await test('home: sign-up form validates and says honestly that nothing was sent', async () => {
    await ev(`document.querySelector('#join').scrollIntoView()`);
    await ev(`document.querySelector('#join form').requestSubmit()`);
    await waitFor(`document.querySelectorAll('#join .gj-error').length === 7`, '7 validation messages');
    for (const [name, v] of [['name', 'Test User'], ['email', 'test@example.com'], ['city', 'Hyderabad'], ['role', 'teacher']]) {
      await setValue(`#join [name="${name}"]`, v);
    }
    await ev(`(() => { const f = document.querySelector('#join form'); f.querySelector('[name=interest]').click(); f.querySelector('[name=age]').click(); f.querySelector('[name=consent]').click(); f.requestSubmit(); })()`);
    await waitFor(`/not been sent or saved/.test(document.querySelector('#join .gj-form__msg')?.textContent || '')`, 'honest "not connected" message');
    const r = await ev(`({ errors: document.querySelectorAll('#join .gj-error').length, fetches: performance.getEntriesByType('resource').filter((e) => e.initiatorType === 'fetch' && !/\\.(glb|js)/.test(e.name)).length })`);
    expect(r.errors === 0, `${r.errors} validation errors left`);
    expect(r.fetches === 0, 'the form made a network request although no form service is configured');
  });

  await test('home: "Watch Gajju walk" opens a dialog labelled Simulation; Escape closes it', async () => {
    await ev(`window.scrollTo(0, 0); [...document.querySelectorAll('#top button')].find((b) => /Watch Gajju walk/.test(b.textContent)).click()`);
    await waitFor(`document.querySelector('.gj-dialog')?.open`, 'video dialog open');
    const label = await ev(`document.querySelector('.gj-dialog .gj-media-label').textContent`);
    expect(/simulation/i.test(label), `video not labelled as simulation: ${label}`);
    await waitFor(`(() => { const v = document.querySelector('.gj-dialog video'); return v && !v.paused && v.currentTime > 0; })()`, 'dialog video playing', 20000);
    expect(!(await ev(`/to be supplied/i.test(document.querySelector('.gj-dialog').textContent)`)), 'placeholder text still in the dialog');
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
    await waitFor(`!document.querySelector('.gj-dialog').open && document.querySelector('.gj-dialog video').paused`, 'dialog closed and video paused');
    return `${label}, plays and stops on close`;
  });

  await test('home: Join CTA lands on the form; header links open their pages', async () => {
    const landed = (sel) => waitFor(`Math.abs(document.querySelector('${sel}').getBoundingClientRect().top - 72) < 48`, `${sel} in view`, 8000);
    await ev(`document.querySelector('#top a[href="#join"]').click()`);
    await landed('#join');
    // Wait for the new page's own heading: the URL changes before the new page renders (the old
    // page stays up while its code loads), and clicks during a page transition are ignored.
    for (const [path, h1] of [['/gajju-mini', 'Meet Gajju Mini.'], ['/build-log', 'Building Gajju Mini, week by week.'], ['/about', 'We build robots people can understand.']]) {
      await ev(`document.querySelector('header a[href="${path}"]').click()`);
      await waitFor(`location.pathname === '${path}' && document.querySelector('main h1')?.textContent === ${JSON.stringify(h1)} && window.scrollY < 5`, `${path} open at the top`);
    }
    return 'Join, Gajju Mini, Build log, About';
  });

  /* ---------- Gajju Mini, Build log and About pages ---------- */
  const pageBasics = async (path) => {
    await goto(path, `document.querySelector('main h1')`, `${path} heading`);
    const r = await ev(`({
      h1: document.querySelector('main h1').textContent,
      sections: [...document.querySelectorAll('main > section')].map((s) => s.id),
      dark: document.querySelectorAll('main .gj-section--dark').length,
      price: /₹|INR|Rs\\.?\\s?\\d/.test(document.querySelector('main').textContent),
      buy: [...document.querySelectorAll('main button, main a')].filter((b) => /add to cart|buy now|checkout|reserve for/i.test(b.textContent)).length,
      form: !!document.querySelector('main #join form'),
      current: document.querySelector('.gj-header a[aria-current="page"]')?.getAttribute('href') || null,
      overflow: document.documentElement.scrollWidth - innerWidth,
    })`);
    expect(!r.price, `${path} shows a price`);
    expect(r.buy === 0, `${path} has purchase controls`);
    expect(r.form, `${path} does not end with the sign-up form`);
    expect(r.current === path, `active link is ${r.current}`);
    expect(r.dark <= 1, `${r.dark} dark bands`);
    expect(r.overflow <= 0, `horizontal overflow ${r.overflow}px`);
    return r;
  };

  await test('/gajju-mini: sections, real 3D viewer, specs with honest statuses', async () => {
    const r = await pageBasics('/gajju-mini');
    expect(r.h1 === 'Meet Gajju Mini.', `h1: ${r.h1}`);
    const ORDER = ['top', 'what-it-does', 'see-it-walk', 'kit-or-ready-made', 'specifications', 'learning', 'safe-by-design', 'join'];
    expect(JSON.stringify(r.sections) === JSON.stringify(ORDER), `sections: ${r.sections}`);
    const specs = await ev(`[...document.querySelectorAll('.gj-table tbody tr')].map((tr) => tr.querySelector('th').textContent + '=' + tr.querySelector('td:last-child').textContent)`);
    const status = Object.fromEntries(specs.map((s) => s.split('=')));
    expect(specs.length === 15, `${specs.length} spec rows`);
    // Rows still awaiting engineering confirmation show the document's "Planned" label publicly.
    for (const k of ['Legs', 'Brain', 'Eyes', 'Printed parts', 'Weight', 'Power', 'Connection', 'Software']) expect(status[k] === 'Planned', `${k}: ${status[k]}`);
    for (const k of ['Size', 'Motors', 'Ears and voice', 'Balance', 'Head']) expect(status[k] === 'In the 3D design', `${k}: ${status[k]}`);
    await ev(`document.querySelector('.gj-viewer').scrollIntoView()`);
    await waitFor(`document.querySelectorAll('.gj-groups button').length === 8 && document.querySelectorAll('.gj-viewer__stage canvas').length === 1`, 'viewer loaded', 30000);
    expect((await ev(`document.querySelectorAll('canvas').length`)) === 2, 'expected exactly two canvases (hero + viewer)');
    const v = await ev(`(() => { const s = document.querySelector('#see-it-walk'); const vid = s.querySelector('video'); return { sources: [...vid.querySelectorAll('source')].map((x) => x.getAttribute('src')), preload: vid.preload, label: s.querySelector('.gj-video-card__label').textContent, placeholder: /to be supplied/i.test(s.textContent) }; })()`);
    expect(v.sources.length === 2 && v.sources.every((s) => s.startsWith('/media/DOC-website-hero-loop-v2.')), `video sources: ${v.sources}`);
    expect(v.preload === 'none' && v.label === 'Simulation' && !v.placeholder, `see-it-walk video: ${JSON.stringify(v)}`);
    return `${r.sections.length} sections, ${specs.length} spec rows`;
  });

  await test('/build-log: three documented milestones, no invented posts', async () => {
    const r = await pageBasics('/build-log');
    expect(r.h1 === 'Building Gajju Mini, week by week.', `h1: ${r.h1}`);
    const items = await ev(`[...document.querySelectorAll('.gj-log__item')].map((li) => li.querySelector('.gj-status').textContent + ' | ' + li.querySelector('.gj-timeline__when').textContent + ' | ' + li.querySelector('p').textContent)`);
    expect(JSON.stringify(items) === JSON.stringify([
      'Done | November 2026 | Designed and tested in simulation',
      'Planned | December 2026 | First complete Gajju Mini',
      'Planned | Early 2027 | Smart behaviours, then school pilots',
    ]), `milestones: ${items}`);
    expect((await ev(`document.querySelectorAll('.gj-post').length`)) === 0, 'a post is published');
    expect(await ev(`!!document.querySelector('.gj-log__empty')`), 'empty state missing');
    return items.length + ' milestones, 0 posts';
  });

  await test('/about: document content only; unconfirmed email not linked', async () => {
    const r = await pageBasics('/about');
    expect(r.h1 === 'We build robots people can understand.', `h1: ${r.h1}`);
    const c = await ev(`({
      generalLinked: !![...document.querySelectorAll('#contact a')].find((a) => /ello@getgajju/.test(a.textContent)),
      mailtos: [...document.querySelectorAll('#contact a[href^="mailto:"]')].map((a) => a.getAttribute('href')),
      external: [...document.querySelectorAll('main a[target="_blank"]')].filter((a) => !a.closest('form')).map((a) => a.getAttribute('href') + ' ' + a.rel),
      address: document.querySelector('#contact address').textContent,
    })`);
    expect(!c.generalLinked, 'the unconfirmed general email is a link');
    expect(JSON.stringify(c.mailtos) === JSON.stringify(['mailto:schools@getgajju.com', 'mailto:press@getgajju.com']), `mail links: ${c.mailtos}`);
    expect(c.external.every((e) => e.startsWith('https://neonflake.com noopener')), `external links: ${c.external}`);
    expect(/Meridian Plaza/.test(c.address), 'address missing');
    await ev(`document.querySelector('#top a[href="#contact"]').click()`);
    await waitFor(`Math.abs(document.querySelector('#contact').getBoundingClientRect().top - 72) < 48`, 'Contact button lands on #contact');
    return `${r.sections.length} sections`;
  });

  /* ---------- Founding teachers and makers application ---------- */
  const formFetches = () => ev(`performance.getEntriesByType('resource').filter((e) => ['fetch', 'xmlhttprequest', 'beacon'].includes(e.initiatorType) && !/\\.(glb|js|css)(\\?|$)/.test(e.name)).length`);

  await test('home section 9: founding programme between "Where we are" and Join; number not published', async () => {
    await goto('/', `document.querySelector('#founding a[href="/founding"]')`, 'Apply button');
    const r = await ev(`(() => {
      const ids = [...document.querySelectorAll('main > section')].map((s) => s.id);
      const s = document.querySelector('#founding');
      return {
        before: ids[ids.indexOf('founding') - 1], after: ids[ids.indexOf('founding') + 1],
        title: s.querySelector('h2').textContent,
        text: s.querySelector('p[data-reveal]').textContent.replace(/\\s+/g, ' ').trim(),
        buttons: [...s.querySelectorAll('a')].map((a) => a.textContent.trim() + ' ' + a.getAttribute('href')),
      };
    })()`);
    expect(r.before === 'about' && r.after === 'join', `founding sits between ${r.before} and ${r.after}`);
    expect(r.title === 'Build the first Gajjus with us.', `title: ${r.title}`);
    expect(r.text === 'We are giving Gajjus to teachers and makers who will build it first, use it with students and tell us honestly what to fix.', `text: ${r.text}`);
    expect(!/\\d/.test(r.text), 'the unconfirmed number of places is published');
    expect(JSON.stringify(r.buttons) === JSON.stringify(['Apply /founding']), `buttons: ${r.buttons}`);
    return 'position 9; "[20–25]" hidden';
  });

  await test('Founding has no header, footer or menu link; /open-source is not published', async () => {
    const seen = [];
    for (const path of ['/', '/gajju-mini', '/schools', '/founding']) {
      await goto(path, `document.querySelector('main h1')`);
      const n = await ev(`document.querySelectorAll('header a[href^="/founding"], footer a[href^="/founding"], #gj-mobile-menu a[href^="/founding"], header a[href^="/open-source"], footer a[href^="/open-source"]').length`);
      expect(n === 0, `${path}: ${n} founding/open-source links in the header, footer or menu`);
      seen.push(path);
    }
    const active = await ev(`document.querySelectorAll('.gj-header a[aria-current="page"]').length`);
    expect(active === 0, 'a header link is marked current on /founding');
    await goto('/open-source', `location.pathname === '/' && document.querySelector('#gj-hero-title')`, '/open-source redirects home');
    const res = await fetch(BASE + '/founding');
    expect(res.ok, `/founding direct request: HTTP ${res.status}`);
    return `${seen.length} pages checked; /open-source → Home`;
  });

  await test('home: "Apply" opens the founding application page', async () => {
    await goto('/', `document.querySelector('#founding a[href="/founding"]')`, 'Apply button');
    await ev(`document.querySelector('#founding a[href="/founding"]').click()`);
    await waitFor(`location.pathname === '/founding' && document.querySelector('main h1')?.textContent === 'Apply to build the first Gajjus with us.'`, 'founding page');
  });

  await test('/founding: document fields, clear required/optional, validation, honest "not submitted"', async () => {
    await goto('/founding', `document.querySelector('#apply form')`);
    const f = await ev(`(() => {
      const form = document.querySelector('#apply form');
      return {
        names: [...new Set([...form.elements].map((e) => e.name).filter(Boolean))],
        optional: [...form.querySelectorAll('.gj-field__opt')].map((o) => o.closest('.gj-field').querySelector('label').textContent.replace(/\\s*\\(optional\\)/, '')),
        roles: [...form.querySelectorAll('[name=role] option')].map((o) => o.textContent).slice(1),
        button: form.querySelector('button[type=submit]').textContent,
        note: form.querySelector('.gj-caption')?.textContent,
      };
    })()`);
    expect(JSON.stringify(f.names) === JSON.stringify(['name', 'email', 'whatsapp', 'city', 'role', 'organisation', 'link', 'plan', 'age', 'consent']), `fields: ${f.names}`);
    expect(JSON.stringify(f.optional) === JSON.stringify(['WhatsApp number', 'Link to your work or channel']), `optional: ${f.optional}`);
    expect(JSON.stringify(f.roles) === JSON.stringify(['Teacher', 'Atal Tinkering Lab in-charge', 'Maker', 'Student', 'Other']), `roles: ${f.roles}`);
    expect(f.button === 'Send my application', `button: ${f.button}`);
    expect(/required unless marked optional/.test(f.note || ''), 'no required-fields note');
    const before = await formFetches();
    // Empty submit: 8 required answers missing.
    await ev(`document.querySelector('#apply form').requestSubmit()`);
    await waitFor(`document.querySelectorAll('#apply .gj-error').length === 8`, '8 validation messages');
    expect(await ev(`document.activeElement === document.querySelector('#apply [name=name]')`), 'focus did not move to the first problem');
    // Bad email, short phone and a non-link are caught.
    for (const [name, v] of [['name', 'Test Maker'], ['email', 'not-an-email'], ['whatsapp', '12345'], ['city', 'Hyderabad'], ['role', 'Maker'], ['organisation', 'Test Lab'], ['link', 'not a link'], ['plan', 'Build it with my class and report what breaks.']]) {
      await setValue(`#apply [name="${name}"]`, v);
    }
    await ev(`(() => { const f = document.querySelector('#apply form'); f.querySelector('[name=age]').click(); f.querySelector('[name=consent]').click(); f.requestSubmit(); })()`);
    await waitFor(`document.querySelectorAll('#apply .gj-error').length === 3`, 'email, phone and link errors');
    const errs = await ev(`[...document.querySelectorAll('#apply .gj-error')].map((e) => e.id.split('-').slice(-2, -1)[0])`);
    // Fix them and submit: honest "not submitted", no thank-you, no request.
    await setValue('#apply [name="email"]', 'maker@example.com');
    await setValue('#apply [name="whatsapp"]', '');
    await setValue('#apply [name="link"]', 'youtube.com/@testmaker');
    await ev(`document.querySelector('#apply form').requestSubmit()`);
    await waitFor(`/has not been submitted/.test(document.querySelector('#apply .gj-form__msg')?.textContent || '')`, 'not-submitted message');
    const r = await ev(`({ errors: document.querySelectorAll('#apply .gj-error').length, thanks: /Thank you for applying/.test(document.querySelector('main').textContent), kept: document.querySelector('#apply [name=plan]').value.length > 0, focused: document.activeElement === document.querySelector('#apply .gj-form__msg') })`);
    expect(r.errors === 0 && !r.thanks, `after valid submit: ${JSON.stringify(r)}`);
    expect(r.kept, 'answers were cleared although nothing was sent');
    expect(r.focused, 'message did not receive focus');
    expect((await formFetches()) === before, 'the application made a network request');
    return `fields ok; caught ${errs.join(', ')}; nothing sent`;
  });

  await test('/founding at 390px: no overflow, form fields full width', async () => {
    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    try {
      await goto('/founding', `document.querySelector('#apply form')`);
      const r = await ev(`({ overflow: document.documentElement.scrollWidth - innerWidth, widths: [...document.querySelectorAll('#apply .gj-input')].map((i) => Math.round(i.getBoundingClientRect().width)) })`);
      expect(r.overflow <= 0, `overflow ${r.overflow}px`);
      expect(r.widths.every((w) => w >= 280), `narrow fields: ${r.widths}`);
      return `${r.widths.length} fields, ${Math.min(...r.widths)}px+ wide`;
    } finally {
      await send('Emulation.clearDeviceMetricsOverride');
    }
  });

  await test('build log sign-ups are tagged "build-log"; other pages untagged; no request sent', async () => {
    await goto('/build-log', `document.querySelector('#join form')`);
    const tag = await ev(`document.querySelector('#join form').dataset.tags`);
    expect(tag === 'build-log', `build log form tags: ${tag}`);
    const before = await formFetches();
    for (const [name, v] of [['name', 'Test'], ['email', 'test@example.com'], ['city', 'Pune'], ['role', 'maker']]) await setValue(`#join [name="${name}"]`, v);
    await ev(`(() => { const f = document.querySelector('#join form'); f.querySelector('[name=interest]').click(); f.querySelector('[name=age]').click(); f.querySelector('[name=consent]').click(); f.requestSubmit(); })()`);
    await waitFor(`/not been sent or saved/.test(document.querySelector('#join .gj-form__msg')?.textContent || '')`, 'honest "not sent" message');
    expect((await formFetches()) === before, 'the sign-up made a network request');
    await goto('/', `document.querySelector('#join form')`);
    expect((await ev(`document.querySelector('#join form').dataset.tags ?? null`)) === null, 'Home form is tagged');
    return 'build-log';
  });

  /* ---------- Phase 2: For schools and For parents ---------- */
  // Claims these pages must never make (brief: no invented pilots, benefits, certifications,
  // booking links, response times or prices).
  const OVERCLAIM = /guarantee|certified (safe|for)|is safety[- ]certified|now booking|book (a|your) pilot now|within \d+ (working )?days|\b24 ?hours\b|reply (within|in) |₹|INR|price is|tested and (safe|approved)/i;

  await test('/schools: document sections, one dark band, Planned labels, no external links', async () => {
    const r0 = await pageBasics('/schools');
    expect(r0.h1 === 'A Physical AI lab that fits on a desk.', `h1: ${r0.h1}`);
    expect(JSON.stringify(r0.sections) === JSON.stringify(['top', 'why', 'stages', 'pilots', 'founding-schools', 'faq', 'enquiry', 'join']), `sections: ${r0.sections}`);
    const r = await ev(`(() => {
      const main = document.querySelector('main');
      const text = (sel) => document.querySelector(sel)?.textContent || '';
      return {
        lead: text('#top .gj-hero__lead'),
        hero: [...document.querySelectorAll('#top .gj-btns a')].map((a) => a.textContent + ' ' + a.getAttribute('href')),
        heroMedia: text('#top .gj-media-label'),
        why: [...document.querySelectorAll('#why h3')].map((h) => h.textContent),
        stages: [...document.querySelectorAll('#stages .gj-ladder__step h3')].map((h) => h.textContent),
        stagesNote: text('#stages .gj-note'),
        darkId: document.querySelector('main .gj-section--dark')?.id,
        pilotsStatus: text('#pilots .gj-status'),
        pilots: [...document.querySelectorAll('#pilots li')].map((l) => l.textContent),
        pilotsText: text('#pilots'),
        foundingTitle: text('#founding-schools h2'),
        foundingStatus: text('#founding-schools .gj-status'),
        foundingCta: document.querySelector('#founding-schools .gj-btn')?.getAttribute('href'),
        faq: [...document.querySelectorAll('#faq .gj-faq__q, #faq summary, #faq button[aria-expanded]')].map((q) => q.textContent.trim()),
        faqText: text('#faq'),
        external: [...main.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')).filter((h) => !/^(\\/|#)/.test(h)),
        text: main.textContent,
        dialogs: document.querySelectorAll('dialog[open]').length,
      };
    })()`);
    expect(/Physical AI is AI that sees, decides and moves in the real world/.test(r.lead), `lead: ${r.lead}`);
    expect(JSON.stringify(r.hero) === JSON.stringify(['Book a call #enquiry', 'Become a founding school #enquiry']), `hero buttons: ${r.hero}`);
    expect(/simulation|render/i.test(r.heroMedia), `hero media not labelled: "${r.heroMedia}"`);
    expect(r.why.length === 4, `${r.why.length} "why" cards`);
    expect(JSON.stringify(r.stages) === JSON.stringify(['Build', 'Program', 'Teach', 'Train']), `stages: ${r.stages}`);
    expect(r.stagesNote.includes('Lesson plans for each stage are being written and will come with the first kits.'), `stages note: ${r.stagesNote}`);
    expect(r.darkId === 'pilots', `dark band is #${r.darkId}`);
    expect(r.pilotsStatus === 'Planned' && /early 2027/i.test(r.pilotsText) && /not open for booking yet/.test(r.pilotsText), 'pilots not labelled Planned / not-yet-bookable');
    expect(JSON.stringify(r.pilots) === JSON.stringify(['20-25 Gajju Mini robots', 'A teacher training session', 'The first lesson plans', 'Direct support from our team']), `pilot list: ${r.pilots}`);
    expect(r.foundingTitle === 'Build the first Gajju Minis with your students.' && r.foundingStatus === 'Planned' && r.foundingCta === '#enquiry', `founding schools: ${r.foundingTitle} / ${r.foundingStatus} / ${r.foundingCta}`);
    expect(r.faq.length === 4 && !r.faq.some((q) => /students per robot/i.test(q)), `FAQ (students-per-robot must be hidden until decided): ${r.faq}`);
    expect(/Will there be certificates or competitions\?/.test(r.faqText) && /planned/i.test(r.faqText), 'certificates not labelled planned');
    expect(/It can make its own network\./.test(r.faqText), 'Wi-Fi answer missing');
    expect(r.external.length === 0, `external links: ${r.external}`);
    const m = r.text.match(OVERCLAIM);
    expect(!m, `over-claim on the page: "${m?.[0]}"`);
    expect(r.dialogs === 0, 'a pop-up is open');
    // "Book a call" lands on the enquiry form.
    await ev(`document.querySelector('#top a[href="#enquiry"]').click()`);
    await waitFor(`Math.abs(document.querySelector('#enquiry').getBoundingClientRect().top - 72) < 48`, '#enquiry in view', 8000);
    return `${r0.sections.length} sections, ${r.faq.length} FAQ, pilots Planned`;
  });

  await test('/schools enquiry form: 11 required answers, validation, honest "nothing was sent", no request', async () => {
    await goto('/schools', `document.querySelector('#enquiry form')`);
    const f = await ev(`(() => {
      const form = document.querySelector('#enquiry form');
      return {
        title: document.querySelector('#enquiry h2').textContent,
        names: [...new Set([...form.elements].map((e) => e.name).filter(Boolean))],
        roles: [...form.querySelectorAll('[name=role] option')].map((o) => o.textContent).slice(1),
        printer: [...form.querySelectorAll('[name=printer]')].map((i) => i.value),
        optional: form.querySelectorAll('.gj-field__opt').length,
        button: form.querySelector('button[type=submit]').textContent,
        note: form.querySelector('.gj-caption')?.textContent,
      };
    })()`);
    expect(f.title === "Let's explore Gajju Mini for your school.", `title: ${f.title}`);
    expect(JSON.stringify(f.names) === JSON.stringify(['name', 'school', 'city', 'role', 'classes', 'students', 'printer', 'plan', 'email', 'phone', 'consent']), `fields: ${f.names}`);
    expect(JSON.stringify(f.roles) === JSON.stringify(['Teacher', 'Lab in-charge', 'Principal', 'Other']), `roles: ${f.roles}`);
    expect(JSON.stringify(f.printer) === JSON.stringify(['yes', 'no']), `printer: ${f.printer}`);
    expect(f.optional === 0 && /All fields are required/.test(f.note || ''), 'fields not all required');
    expect(f.button === 'Book a call', `button: ${f.button}`);
    const before = await formFetches();
    await ev(`document.querySelector('#enquiry form').requestSubmit()`);
    await waitFor(`document.querySelectorAll('#enquiry .gj-error').length === 11`, '11 validation messages');
    expect(await ev(`document.activeElement === document.querySelector('#enquiry [name=name]')`), 'focus did not move to the first problem');
    for (const [name, v] of [['name', 'Test Teacher'], ['school', 'Test School'], ['city', 'Hyderabad'], ['role', 'Teacher'], ['classes', 'Class 6 to 8'], ['students', '2.5'], ['plan', 'Run a robotics club.'], ['email', 'bad'], ['phone', '123']]) {
      await setValue(`#enquiry [name="${name}"]`, v);
    }
    await ev(`(() => { const f = document.querySelector('#enquiry form'); f.querySelector('[name=printer][value=no]').click(); f.querySelector('[name=consent]').click(); f.requestSubmit(); })()`);
    await waitFor(`document.querySelectorAll('#enquiry .gj-error').length === 3`, 'students, email and phone errors');
    await setValue('#enquiry [name="students"]', '40');
    await setValue('#enquiry [name="email"]', 'teacher@example.com');
    await setValue('#enquiry [name="phone"]', '+91 98765 43210');
    await ev(`document.querySelector('#enquiry form').requestSubmit()`);
    await waitFor(`/nothing you entered was sent or stored/.test(document.querySelector('#enquiry .gj-form__msg')?.textContent || '')`, 'honest not-connected message');
    const r = await ev(`({ errors: document.querySelectorAll('#enquiry .gj-error').length, thanks: /Thank you/.test(document.querySelector('#enquiry').textContent), kept: document.querySelector('#enquiry [name=plan]').value.length > 0, focused: document.activeElement === document.querySelector('#enquiry .gj-form__msg'), dialogs: document.querySelectorAll('dialog[open]').length, msg: document.querySelector('#enquiry .gj-form__msg').textContent })`);
    expect(r.errors === 0 && !r.thanks, `after valid submit: ${JSON.stringify(r)}`);
    expect(r.kept, 'answers were cleared although nothing was sent');
    expect(r.focused, 'message did not receive focus');
    expect(r.dialogs === 0, 'a pop-up opened');
    expect(!/within|working days|hours/i.test(r.msg), `response-time promise: ${r.msg}`);
    expect((await formFetches()) === before, 'the enquiry made a network request');
    return 'fields ok; 11 required; caught students, email, phone; nothing sent';
  });

  await test('/parents: document sections, design-goal and in-development labels, privacy link only', async () => {
    const r0 = await pageBasics('/parents');
    expect(JSON.stringify(r0.sections) === JSON.stringify(['top', 'learns', 'children', 'home-help', 'kit-or-ready-made', 'privacy', 'faq', 'join']), `sections: ${r0.sections}`);
    const r = await ev(`(() => {
      const main = document.querySelector('main');
      const text = (sel) => document.querySelector(sel)?.textContent || '';
      return {
        hero: [...document.querySelectorAll('#top .gj-btns a')].map((a) => a.textContent + ' ' + a.getAttribute('href')),
        heroMedia: text('#top .gj-media-label'),
        learns: [...document.querySelectorAll('#learns h3')].map((h) => h.textContent),
        childrenStatus: text('#children .gj-status'),
        childrenNote: text('#children .gj-note'),
        home: [...document.querySelectorAll('#home-help h3')].map((h) => h.textContent),
        homeStatus: text('#home-help .gj-status'),
        kit: [...document.querySelectorAll('#kit-or-ready-made h3')].map((h) => h.textContent),
        kitText: text('#kit-or-ready-made'),
        privacyLinks: [...document.querySelectorAll('#privacy a')].map((a) => a.getAttribute('href')),
        privacyText: text('#privacy'),
        faq: text('#faq'),
        joinNames: [...new Set([...document.querySelectorAll('#join form [name]')].map((e) => e.name))],
        external: [...main.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')).filter((h) => !/^(\\/|#)/.test(h)),
        text: main.textContent,
      };
    })()`);
    expect(JSON.stringify(r.hero) === JSON.stringify(['Join the first-batch list #join']), `hero: ${r.hero}`);
    expect(/render|simulation/i.test(r.heroMedia), `hero media not labelled: "${r.heroMedia}"`);
    expect(r.learns.length === 4, `${r.learns.length} learning cards`);
    expect(r.childrenStatus === 'Design goals' && /not test results/.test(r.childrenNote), 'safety points not labelled as design goals');
    expect(JSON.stringify(r.home) === JSON.stringify(['Door watch', 'Study buddy', 'Cooker whistle counter']) && r.homeStatus === 'In development', `home activities: ${r.home} / ${r.homeStatus}`);
    expect(JSON.stringify(r.kit) === JSON.stringify(['Kit', 'Ready-made']) && /share the price when reservations open/.test(r.kitText), `kit: ${r.kit}`);
    expect(!/\btested\b/i.test(r.kitText), 'kit section claims testing');
    expect(JSON.stringify(r.privacyLinks) === JSON.stringify(['/privacy']), `privacy links: ${r.privacyLinks}`);
    expect(!/not sent to the internet/i.test(r.privacyText), 'the unapproved privacy statement is published');
    for (const q of ['When can I get one?', 'How much will it cost?', 'What age is it for?', 'Do I need a 3D printer?', 'Does it need the internet or a phone?', 'What if a part breaks?', 'Is there a bigger Gajju?']) {
      expect(r.faq.includes(q), `FAQ missing "${q}"`);
    }
    expect(r.external.length === 0, `external links: ${r.external}`);
    const m = r.text.match(OVERCLAIM);
    expect(!m, `over-claim on the page: "${m?.[0]}"`);
    // The same shared sign-up form as Home.
    await goto('/', `document.querySelector('#join form')`);
    const homeNames = await ev(`[...new Set([...document.querySelectorAll('#join form [name]')].map((e) => e.name))]`);
    expect(JSON.stringify(r.joinNames) === JSON.stringify(homeNames), `parents form ${r.joinNames} vs home ${homeNames}`);
    return `${r0.sections.length} sections, ${r.learns.length} learning cards, shared sign-up form`;
  });

  await test('/parents: "Join the first-batch list" lands on the sign-up form; it says honestly nothing was sent', async () => {
    await goto('/parents', `document.querySelector('#join form')`);
    await ev(`document.querySelector('#top a[href="#join"]').click()`);
    await waitFor(`Math.abs(document.querySelector('#join').getBoundingClientRect().top - 72) < 48`, '#join in view', 8000);
    const before = await formFetches();
    for (const [name, v] of [['name', 'Test Parent'], ['email', 'parent@example.com'], ['city', 'Chennai'], ['role', 'parent']]) await setValue(`#join [name="${name}"]`, v);
    await ev(`(() => { const f = document.querySelector('#join form'); f.querySelector('[name=interest]').click(); f.querySelector('[name=age]').click(); f.querySelector('[name=consent]').click(); f.requestSubmit(); })()`);
    await waitFor(`/not been sent or saved/.test(document.querySelector('#join .gj-form__msg')?.textContent || '')`, 'honest "not sent" message');
    expect((await formFetches()) === before, 'the sign-up made a network request');
    return 'lands on #join; nothing sent';
  });

  await test('/schools and /parents load directly (deep links) with their own titles', async () => {
    const out = [];
    for (const [path, title] of [['/schools', 'For schools and labs · Gajju'], ['/parents', 'For parents · Gajju']]) {
      const res = await fetch(BASE + path);
      expect(res.ok, `${path}: HTTP ${res.status}`);
      await goto(path, `document.querySelector('main h1')`);
      await sleep(150);
      const t = await ev('document.title');
      expect(t === title, `${path} title: ${t}`);
      out.push(t);
    }
    return out.join(' | ');
  });

  await shopTest('product: 3D viewer code loads only when the 3D view is opened', async () => {
    await goto('/product/GAJJU', `document.querySelector('.thumb--3d')`);
    expect((await loadedScripts('/gajju-viewer-/')) === 0, 'viewer code loaded before the 3D view was opened');
    await ev(`document.querySelector('.thumb--3d').click()`);
    await waitFor(`document.querySelectorAll('.pdp__stage canvas').length === 1 && document.querySelectorAll('.gtools button').length > 0`, '3D viewer with its toolbar', 30000);
    return `${await ev(`document.querySelectorAll('.gtools button').length`)} viewer tools`;
  });

  await shopTest('/shop renders products and sorts', async () => {
    await goto('/shop', `document.querySelectorAll('main article').length >= 1`, 'shop products');
    await ev(`(() => { const s = document.querySelector('main select'); s.value = 'price-asc'; s.dispatchEvent(new Event('change', { bubbles: true })); })()`);
    await sleep(200);
    const prices = await ev(`[...document.querySelectorAll('main article')].map((a) => Number((a.textContent.match(/₹\\s?([\\d,]+)/) || [,'0'])[1].replace(/,/g, '')))`);
    expect(prices.length >= 1, 'no products');
    expect(prices.every((p, i) => i === 0 || prices[i - 1] <= p), `not sorted ascending: ${prices}`);
    return `${prices.length} products`;
  });

  for (const id of ['GAJJU', 'GAJJU-kit']) {
    await shopTest(`/product/${id} renders`, async () => {
      await goto(`/product/${id}`, `document.querySelector('main h1')`, 'product heading');
      const r = await ev(`({ h1: document.querySelector('main h1').textContent, thumbs: document.querySelectorAll('.thumb').length, add: !!document.querySelector('.review-form') })`);
      expect(/gajju/i.test(r.h1), `unexpected heading: ${r.h1}`);
      expect(r.thumbs >= 1, 'no gallery thumbnails');
      return r.h1;
    });
  }

  await shopTest('/product/:id with an unknown id shows "not found"', async () => {
    await goto('/product/does-not-exist', `document.querySelector('main h1')`);
    const h1 = await ev(`document.querySelector('main h1').textContent`);
    expect(/not found|couldn.t find|no product/i.test(h1), `unexpected heading: ${h1}`);
    return h1;
  });

  await shopTest('add to cart from /shop opens the drawer', async () => {
    await goto('/shop', `document.querySelector('main article button')`);
    await ev(`document.querySelector('main article button').click()`);
    await waitFor(`document.querySelector('[data-panel=cart]')?.classList.contains('is-open')`, 'cart drawer to open');
    const count = await ev(`document.querySelector('.cart-count')?.textContent.trim()`);
    expect(count === '1', `cart count is ${count}`);
    return `cart count ${count}`;
  });

  await shopTest('/cart shows the line, quantity and promo work', async () => {
    await goto('/cart', `document.querySelectorAll('.cart-page .line').length >= 1`, 'cart line');
    await ev(`document.querySelector('.cart-page .qty button[aria-label="Increase quantity"]').click()`);
    await waitFor(`document.querySelector('.cart-count')?.textContent.trim() === '2'`, 'quantity to become 2');
    await setValue('#promo', 'NEX10');
    await ev(`document.querySelector('#promo').form.requestSubmit()`);
    await waitFor(`/NEX10|discount|10%/i.test(document.querySelector('.summary')?.textContent || '')`, 'promo to apply');
    return 'qty 2, NEX10 applied';
  });

  await shopTest('/checkout validates, then places an order', async () => {
    await goto('/checkout', `document.querySelector('.checkout__form')`);
    await ev(`document.querySelector('.checkout__form').requestSubmit()`);
    await waitFor(`document.querySelectorAll('.field.is-invalid').length > 0`, 'validation errors');
    const vals = {
      email: 'test@example.com', phone: '+91 98765 43210', first: 'Test', last: 'User',
      address: '1 Main Street', city: 'Hyderabad', postal: '500001',
      cardName: 'Test User', cardNumber: '4242 4242 4242 4242', cardExp: '12/29', cardCvc: '123',
    };
    for (const [k, v] of Object.entries(vals)) await setValue(`.checkout__form [name="${k}"]`, v);
    await ev(`document.querySelector('.checkout__form').requestSubmit()`);
    await waitFor(`document.querySelector('.success h1')`, 'order confirmation', 10000);
    const r = await ev(`({ url: location.pathname + location.search, count: document.querySelector('.cart-count')?.textContent.trim() })`);
    expect(/^\/checkout\?order=/.test(r.url), `unexpected URL ${r.url}`);
    expect(r.count === '0' || r.count === '', `cart not emptied (count ${r.count})`);
    return r.url;
  });

  /* ---------- in-app navigation and redirects ---------- */
  await shopTest('in-app link navigation (page curtain): cart → shop → home via the header', async () => {
    await goto('/cart', `document.querySelector('.gj-header a[href="/shop"]')`);
    await ev(`document.querySelector('.gj-header a[href="/shop"]').click()`);
    await waitFor(`location.pathname === '/shop' && document.querySelectorAll('main article').length >= 1`, 'navigation to /shop');
    await ev(`document.querySelector('.gj-header__brand').click()`);
    await waitFor(`location.pathname === '/' && document.querySelector('#gj-hero-title')`, 'navigation home via the wordmark');
  });

  await test('leaving the home page removes every 3D canvas', async () => {
    await goto('/', `document.querySelector('.gj-hero__media')`, 'hero');
    await ev(`document.querySelector('#explore').scrollIntoView()`);
    await waitFor(`document.querySelector('.gj-viewer__stage canvas')`, 'viewer canvas', 30000);
    // Leave through the header to a page with no 3D (About).
    await ev(`document.querySelector('.gj-header a[href="/about"]').click()`);
    await waitFor(`location.pathname === '/about' && document.querySelector('main h1')?.textContent === 'We build robots people can understand.'`, 'navigation to /about');
    await waitFor(`document.querySelectorAll('canvas').length === 0`, 'all canvases removed');
  });

  await test('in-app link navigation (page curtain): Build log → About → Home via the wordmark', async () => {
    await goto('/build-log', `document.querySelector('main h1')`);
    await ev(`document.querySelector('.gj-header a[href="/about"]').click()`);
    await waitFor(`location.pathname === '/about' && document.querySelector('main h1')?.textContent === 'We build robots people can understand.'`, 'navigation to /about');
    await ev(`document.querySelector('.gj-header__brand').click()`);
    await waitFor(`location.pathname === '/' && document.querySelector('#gj-hero-title')`, 'navigation home via the wordmark');
  });

  /* ---------- Phase 4 shop hidden (default build) ---------- */
  if (!SHOP) {
    await test('shop routes redirect home; no prices, cart or checkout anywhere', async () => {
      for (const path of ['/shop', '/product/GAJJU', '/product/GAJJU-kit', '/cart', '/checkout', '/shop.html', '/product.html?id=GAJJU', '/cart.html', '/checkout.html']) {
        await goto(path, `location.pathname === '/' && document.querySelector('#gj-hero-title')`, `${path} → /`);
        const r = await ev(`({ price: /₹/.test(document.body.textContent), panels: document.querySelectorAll('[data-panel=cart], [data-panel=search], [data-panel=account]').length, shopUi: document.querySelectorAll('.gj-header__cart, .gj-header a[href="/shop"]').length })`);
        expect(!r.price && r.panels === 0 && r.shopUi === 0, `${path}: ${JSON.stringify(r)}`);
      }
      const shopChunks = await ev(`performance.getEntriesByType('resource').filter((e) => /\\/(Shop|Product|Cart|Checkout)-/.test(e.name)).length`);
      expect(shopChunks === 0, 'shop page code was downloaded');
      return '9 shop addresses → Home';
    });
  }

  /* ---------- shared header, mobile menu and footer ---------- */
  await test('brand: logo in header (full colour) and footer (reverse), favicon set in the head', async () => {
    await goto('/', `document.querySelector('.gj-header .gj-logo')?.complete && document.querySelector('.gj-footer .gj-logo')?.complete`, 'logos');
    const r = await ev(`(() => {
      const h = document.querySelector('.gj-header .gj-logo'); const f = document.querySelector('.gj-footer .gj-logo');
      const links = [...document.querySelectorAll('head link[rel~="icon"], head link[rel="apple-touch-icon"], head link[rel="manifest"]')].map((l) => l.rel + ' ' + l.getAttribute('href'));
      return {
        header: [h.getAttribute('src'), h.alt, h.naturalWidth > 0, Math.round(h.getBoundingClientRect().height)],
        footer: [f.getAttribute('src'), f.alt, f.naturalWidth > 0],
        links, theme: document.querySelector('meta[name=theme-color]').content,
        oldIcon: !!document.querySelector('link[href^="data:"]'),
      };
    })()`);
    expect(r.header[0] === '/brand/logo/svg/gajju-logo-full-colour.svg' && r.header[1] === 'Gajju' && r.header[2], `header logo: ${r.header}`);
    expect(r.header[3] >= 24, `header logo ${r.header[3]}px high (minimum 24)`);
    expect(r.footer[0] === '/brand/logo/svg/gajju-logo-reverse.svg' && r.footer[2], `footer logo: ${r.footer}`);
    expect(JSON.stringify(r.links) === JSON.stringify(['icon /favicon.ico', 'icon /favicon.svg', 'apple-touch-icon /apple-touch-icon.png', 'manifest /site.webmanifest']), `head links: ${r.links}`);
    expect(r.theme.toUpperCase() === '#F6EFE3' && !r.oldIcon, `theme-color ${r.theme}, old icon ${r.oldIcon}`);
    // Every favicon and logo file referenced is served.
    const files = ['/favicon.ico', '/favicon.svg', '/apple-touch-icon.png', '/site.webmanifest', '/android-chrome-192x192.png', '/android-chrome-512x512.png', '/brand/logo/svg/gajju-logo-full-colour.svg', '/brand/logo/svg/gajju-logo-reverse.svg', '/media/DOC-website-hero-loop-v2.webm', '/media/DOC-website-hero-loop-v2.mp4', '/media/DOC-website-hero-poster-v2.jpg'];
    for (const file of files) {
      const res = await fetch(BASE + file);
      expect(res.ok && !/text\/html/.test(res.headers.get('content-type') || ''), `${file}: ${res.status} ${res.headers.get('content-type')}`);
    }
    return `${files.length} files served`;
  });

  await test('header: logo, no theme switch, shop controls only on the shop routes', async () => {
    await goto('/', `document.querySelector('.gj-header')`);
    const home = await ev(`({
      wordmark: document.querySelector('.gj-header__brand img')?.alt,
      font: 'n/a',
      theme: document.querySelectorAll('.theme-toggle').length,
      links: [...document.querySelectorAll('.gj-header__nav a')].map((a) => a.textContent + ' ' + a.getAttribute('href')),
      cta: document.querySelector('.gj-header__cta')?.getAttribute('href'),
      shopControls: document.querySelectorAll('.gj-header__cart, .gj-header a[href="/shop"]').length,
      dark: document.documentElement.dataset.theme,
    })`);
    expect(home.wordmark === 'Gajju', `header logo alt: ${home.wordmark}`);
    expect(home.theme === 0, 'a theme switch is shown');
    expect(home.dark === 'light', `theme is ${home.dark}`);
    expect(JSON.stringify(home.links) === JSON.stringify(['Gajju Mini /gajju-mini', 'Build log /build-log', 'For schools /schools', 'For parents /parents', 'About /about']), `links: ${home.links}`);
    expect(home.cta === '/#join', `Join link goes to ${home.cta}`);
    expect(home.shopControls === 0, 'shop link or cart shown on Home');
    if (!SHOP) return home.links.length + ' links, CTA (shop off: no shop controls)';
    await goto('/shop', `document.querySelector('.gj-header__cart')`);
    const shop = await ev(`({ current: document.querySelector('.gj-header a[href="/shop"]').getAttribute('aria-current'), search: !!document.querySelector('.gj-header [aria-label="Search the shop"]') })`);
    expect(shop.current === 'page' && shop.search, `shop header: ${JSON.stringify(shop)}`);
    await ev(`document.querySelector('.gj-header__cart').click()`);
    await waitFor(`document.querySelector('[data-panel=cart]').classList.contains('is-open')`, 'cart drawer from the header');
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
    await waitFor(`!document.querySelector('[data-panel=cart]').classList.contains('is-open')`, 'cart drawer closed');
    return home.links.length + ' links, CTA, cart on shop routes';
  });

  await test('header: active link marks the current page; Join targets the form on that page', async () => {
    const seen = {};
    for (const path of ['/', '/gajju-mini', '/build-log', '/schools', '/parents', '/about']) {
      await goto(path, `document.querySelector('main h1')`);
      seen[path] = await ev(`({ active: [...document.querySelectorAll('.gj-header__link.is-active')].map((a) => a.textContent).join(), join: document.querySelector('.gj-header__cta').getAttribute('href') })`);
    }
    expect(seen['/'].active === '' && seen['/'].join === '/#join', `home: ${JSON.stringify(seen['/'])}`);
    expect(seen['/gajju-mini'].active === 'Gajju Mini' && seen['/gajju-mini'].join === '/gajju-mini#join', JSON.stringify(seen['/gajju-mini']));
    expect(seen['/build-log'].active === 'Build log' && seen['/build-log'].join === '/build-log#join', JSON.stringify(seen['/build-log']));
    expect(seen['/schools'].active === 'For schools' && seen['/schools'].join === '/schools#join', JSON.stringify(seen['/schools']));
    expect(seen['/parents'].active === 'For parents' && seen['/parents'].join === '/parents#join', JSON.stringify(seen['/parents']));
    expect(seen['/about'].active === 'About' && seen['/about'].join === '/about#join', JSON.stringify(seen['/about']));
    await ev(`document.querySelector('.gj-header__cta').click()`);
    await waitFor(`location.pathname === '/about' && Math.abs(document.querySelector('#join').getBoundingClientRect().top - 72) < 48`, 'Join lands on the About form');
    return 'none on Home; Gajju Mini, Build log, For schools, For parents, About';
  });

  await test('mobile menu: opens, keeps focus inside, Escape closes, links navigate', async () => {
    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    try {
      await goto('/', `getComputedStyle(document.querySelector('.gj-header__burger')).display !== 'none'`, 'menu button');
      expect(await ev(`document.documentElement.scrollWidth <= innerWidth`), 'horizontal overflow at 390px');
      await ev(`document.querySelector('.gj-header__burger').click()`);
      await waitFor(`!document.querySelector('#gj-mobile-menu').hidden && document.querySelector('#gj-mobile-menu').contains(document.activeElement)`, 'menu open with focus inside');
      expect(await ev(`document.querySelector('.gj-header__burger').getAttribute('aria-expanded')`) === 'true', 'aria-expanded not true');
      await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
      await waitFor(`document.querySelector('#gj-mobile-menu').hidden && document.activeElement === document.querySelector('.gj-header__burger')`, 'menu closed, focus back on the menu button');
      await ev(`document.querySelector('.gj-header__burger').click()`);
      await waitFor(`!document.querySelector('#gj-mobile-menu').hidden`, 'menu reopened');
      const menuLinks = await ev(`[...document.querySelectorAll('#gj-mobile-menu nav a')].map((a) => a.textContent).join(', ')`);
      expect(menuLinks === 'Gajju Mini, Build log, For schools, For parents, About', `menu links: ${menuLinks}`);
      await ev(`[...document.querySelectorAll('#gj-mobile-menu a')].find((a) => a.textContent === 'For schools').click()`);
      await waitFor(`document.querySelector('#gj-mobile-menu').hidden && location.pathname === '/schools' && document.querySelector('main h1')?.textContent === 'A Physical AI lab that fits on a desk.'`, 'menu closed and /schools open');
      expect(await ev(`document.documentElement.scrollWidth <= innerWidth`), 'horizontal overflow on /schools at 390px');
      await ev(`document.querySelector('.gj-header__burger').click()`);
      await waitFor(`!document.querySelector('#gj-mobile-menu').hidden`, 'menu reopened on /schools');
      await ev(`[...document.querySelectorAll('#gj-mobile-menu a')].find((a) => a.textContent === 'About').click()`);
      await waitFor(`document.querySelector('#gj-mobile-menu').hidden && location.pathname === '/about' && document.querySelector('main h1')?.textContent === 'We build robots people can understand.'`, 'menu closed and /about open');
      expect(await ev(`document.documentElement.scrollWidth <= innerWidth`), 'horizontal overflow on /about at 390px');
    } finally {
      await send('Emulation.clearDeviceMetricsOverride');
    }
  });

  await test('footer: confirmed content only; Privacy and Terms linked', async () => {
    await goto('/', `document.querySelector('.gj-footer')`);
    const r = await ev(`(() => {
      const f = document.querySelector('.gj-footer');
      return {
        text: f.textContent,
        policies: [...f.querySelectorAll('a')].filter((a) => /privacy|terms/i.test(a.textContent)).map((a) => a.getAttribute('href') + ' ' + a.closest('li').textContent.trim()),
        inputs: f.querySelectorAll('input, form').length,
        hrefs: [...f.querySelectorAll('a')].map((a) => a.getAttribute('href')),
      };
    })()`);
    expect(r.text.includes('© 2026 Neonflake AI Labs Pvt Ltd.') && r.text.includes('Gajju is made by Neonflake AI Labs Pvt Ltd, Hyderabad.'), 'copyright or company line missing');
    expect(!/Eindhoven|Subscribe/.test(r.text) && r.inputs === 0, 'old invented text or newsletter form still in the footer');
    expect(JSON.stringify(r.policies) === JSON.stringify(['/privacy Privacy', '/terms Terms of use']), `policies: ${JSON.stringify(r.policies)}`);
    expect(!/draft|awaiting/i.test(r.text), 'draft labels in the footer');
    const bad = r.hrefs.filter((h) => !['/', '/#join', '/gajju-mini', '/schools', '/parents', '/build-log', '/about', '/privacy', '/terms', '#main'].includes(h));
    expect(bad.length === 0, `unexpected footer links: ${bad}`);
    const order = await ev(`[...document.querySelectorAll('.gj-footer nav[aria-label=Footer] a')].map((a) => a.textContent).join(', ')`);
    expect(order === 'Gajju Mini, For schools, For parents, Build log, About', `footer order: ${order}`);
    expect(!/open source/i.test(await ev(`[...document.querySelectorAll('.gj-footer a, .gj-header a')].map((a) => a.textContent).join(' ')`)), 'an Open source link is shown');
    for (const label of ['Gajju Mini', 'For schools', 'For parents', 'Build log', 'About']) {
      await ev(`[...document.querySelectorAll('.gj-footer a')].find((a) => a.textContent === '${label}').click()`);
      await waitFor(`document.querySelector('.gj-header a[aria-current="page"]')?.textContent === '${label}'`, `${label} from the footer`);
    }
    for (const [label, path, h1] of [['Privacy', '/privacy', 'Privacy Policy'], ['Terms of use', '/terms', 'Terms of Use']]) {
      await ev(`[...document.querySelectorAll('.gj-footer a')].find((a) => a.textContent === '${label}').click()`);
      await waitFor(`location.pathname === '${path}' && document.querySelector('main h1')?.textContent === '${h1}'`, `${label} from the footer`);
    }
    return `${r.hrefs.length} links; Privacy and Terms open their pages`;
  });

  /* ---------- Policy pages (not yet lawyer-approved; see content/policies.js) ---------- */
  // Legal clauses the content document does not supply; none may appear until the lawyer's text does.
  const INVENTED = /indemn|liabilit|warrant|governing law|jurisdiction|arbitration|GDPR|third part(y|ies)|we (do not|don't) use cookies|we use cookies|\b\d+\s*(days|months|years)\b/i;

  for (const [path, h1, topics] of [
    ['/privacy', 'Privacy Policy', ['Information we collect', 'Why we collect this information', 'Who can access your information', 'How long we keep your information', 'Asking us to delete your information', 'Cookies and analytics', 'Children and parental consent']],
    ['/terms', 'Terms of Use', ['Using this website', 'Gajju design files', 'Example programs', 'AI tools', 'Changes you make']],
  ]) {
    await test(`${path}: loads directly, clean page, every documented topic, nothing invented`, async () => {
      await goto(path, `document.querySelector('main h1')`);
      const r = await ev(`(() => {
        const main = document.querySelector('main');
        return {
          h1: main.querySelector('h1').textContent,
          h1s: main.querySelectorAll('h1').length,
          topics: [...main.querySelectorAll('.gj-policy__section h2')].map((h) => h.textContent.replace(/^\\d+\\.\\s*/, '')),
          labels: main.querySelectorAll('.gj-status, nav, .gj-pending').length,
          text: main.textContent,
          emails: (main.textContent.match(/[\\w.+-]+@[\\w-]+\\.[\\w.]+/g) || []),
          title: document.title,
          overflow: document.documentElement.scrollWidth - innerWidth,
        };
      })()`);
      expect(r.h1 === h1, `h1: ${r.h1}`);
      expect(r.h1s === 1, `${r.h1s} page titles`);
      expect(JSON.stringify(r.topics) === JSON.stringify(topics), `topics: ${r.topics}`);
      const internal = r.text.match(/draft|awaiting|to be confirmed|lawyer|TODO|placeholder/i);
      expect(!internal, `internal note visible: "${internal?.[0]}"`);
      expect(!/draft/i.test(r.title), `title says draft: ${r.title}`);
      expect(r.labels === 0, `${r.labels} status labels or contents lists on the page`);
      expect(!/approved|last updated|effective (date|from)/i.test(r.text), 'claims legal approval');
      expect(r.emails.length === 0, `unconfirmed contact details: ${r.emails}`);
      const invented = r.text.match(INVENTED);
      expect(!invented, `unsupported legal wording: "${invented?.[0]}"`);
      if (path === '/privacy') {
        for (const field of ['Your name', 'Your email address', 'phone number for WhatsApp', 'Your city', 'role: parent, teacher, school, student, maker or other', 'Gajju Mini, and the bigger Gajju (later)', 'age confirmation', 'school, college or channel name', 'link to your work or channel', 'What you would do with Gajju Mini', 'when the first Gajju Minis can be reserved', 'build log posts by email', 'applications and reply by email']) {
          expect(r.text.includes(field), `field missing: ${field}`);
        }
        expect(r.text.includes("India's Digital Personal Data Protection Act, 2023") && r.text.includes('parent or guardian agrees'), 'parental consent section incomplete');
        expect(r.text.includes('nothing you type into them is sent or saved'), 'forms status missing');
      } else {
        expect(r.text.includes('Changes owners make to the designs, example programs or AI tools are at their own risk.'), 'documented "own risk" line missing');
      }
      expect(r.overflow <= 0, `overflow ${r.overflow}px`);
      return `${r.topics.length} topics, no internal labels`;
    });
  }

  await test('policy pages at 390px and 820px: no overflow', async () => {
    const out = [];
    for (const [w, h] of [[390, 844], [820, 1180]]) {
      await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: true });
      for (const path of ['/privacy', '/terms']) {
        await goto(path, `document.querySelector('.gj-policy')`);
        const o = await ev('document.documentElement.scrollWidth - innerWidth');
        expect(o <= 0, `${path} at ${w}px overflows by ${o}px`);
        out.push(`${path}@${w}`);
      }
    }
    await send('Emulation.clearDeviceMetricsOverride');
    return out.join(', ');
  });

  await test('form consent links to the Privacy Policy in a new tab, no draft note', async () => {
    for (const path of ['/', '/founding', '/schools', '/parents']) {
      await goto(path, `document.querySelector('main form [name=consent]')`);
      const c = await ev(`(() => { const l = document.querySelector('main form [name=consent]').closest('label'); const a = l.querySelector('a'); return { href: a?.getAttribute('href'), target: a?.target, text: l.textContent }; })()`);
      expect(c.href === '/privacy' && c.target === '_blank', `${path} consent link: ${JSON.stringify(c)}`);
      expect(!/draft|awaiting/i.test(c.text), `${path} consent shows an internal note: ${c.text}`);
    }
    return 'Home, founding, schools enquiry and parents forms';
  });

  await test('legacy URLs redirect', async () => {
    const cases = SHOP
      ? { '/shop.html': '/shop', '/product.html?id=GAJJU': '/product/GAJJU', '/cart.html': '/cart', '/checkout.html': '/checkout', '/index.html': '/' }
      : { '/index.html': '/' }; // the shop's old addresses are covered by the redirect check above
    for (const [from, to] of Object.entries(cases)) {
      await goto(from, `location.pathname === ${JSON.stringify(to)}`, `${from} → ${to}`);
    }
    return Object.keys(cases).length + ' redirects';
  });

  await test('first load of /#learn scrolls to the section', async () => {
    await goto('/about', `document.querySelector('main h1')`); // later visit: quick loader path
    await goto('/#learn', `document.querySelector('#learn')`);
    await waitFor(`Math.abs(document.querySelector('#learn').getBoundingClientRect().top - 72) < 40`, '#learn scrolled into view', 10000);
    return `scrollY ${await ev('Math.round(scrollY)')}`;
  });

  await test('unknown route goes home', async () => {
    await goto('/no-such-page', `location.pathname === '/'`);
  });

  /* ---------- Launch-safe cleanup checks ---------- */
  const PHASE1 = ['/', '/gajju-mini', '/build-log', '/about', '/founding', '/privacy', '/terms'];
  const PHASE2 = ['/schools', '/parents'];
  const ALL_PAGES = [...PHASE1, ...PHASE2];

  await test('no placeholders or internal notes on any Phase 1 or Phase 2 page (including hidden FAQ answers)', async () => {
    const NOTE = /to be confirmed|to come\b|to be supplied|awaiting|content document|waiting for our engineers|\[confirm|placeholder|still to be decided|address to be confirmed/i;
    const found = [];
    for (const path of ALL_PAGES) {
      await goto(path, `document.querySelector('main h1')`);
      const r = await ev(`({ text: document.querySelector('main').textContent, marks: document.querySelectorAll('.gj-pending, .gj-status--awaiting, .gj-placeholder').length })`);
      const m = r.text.match(NOTE);
      if (m || r.marks) found.push(`${path}: "${m?.[0] || ''}" ${r.marks} marked`);
    }
    expect(found.length === 0, found.join('; '));
    return `${ALL_PAGES.length} pages clean`;
  });

  await test('keyboard focus is a 3 px Teal outline on every page', async () => {
    const out = [];
    for (const path of ALL_PAGES) {
      await goto(path, `document.querySelector('main h1')`);
      // Start from the h1 and press Tab: the next control gets keyboard focus (page content, or the
      // footer on pages with no links in their content, such as Privacy and Terms).
      await ev(`(() => { const h = document.querySelector('main h1'); h.tabIndex = -1; h.focus(); })()`);
      await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
      const style = await ev(`(() => { const a = document.activeElement; if (a === document.body || a === document.querySelector('main h1')) return null; const s = getComputedStyle(a); return s.outlineWidth + ' ' + s.outlineStyle + ' ' + s.outlineColor; })()`);
      expect(style === '3px solid rgb(31, 111, 120)', `${path}: focus is "${style}"`);
      out.push(path);
    }
    // The header and footer, too.
    await goto('/about', `document.querySelector('.gj-header__brand')`);
    await ev(`document.querySelector('.gj-footer a[href="/terms"]').focus()`);
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, modifiers: 8 });
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
    const footer = await ev(`(() => { const s = getComputedStyle(document.activeElement); return s.outlineWidth + ' ' + s.outlineStyle + ' ' + s.outlineColor; })()`);
    expect(footer === '3px solid rgb(31, 111, 120)', `footer focus is "${footer}"`);
    return `${out.length} pages + footer`;
  });

  await test('status labels meet WCAG AA contrast (4.5:1)', async () => {
    const ratios = [];
    for (const path of ['/', '/gajju-mini', '/build-log', '/schools', '/parents']) {
      await goto(path, `document.querySelector('.gj-status')`);
      const pairs = await ev(`[...document.querySelectorAll('.gj-status')].map((el) => { const s = getComputedStyle(el); return [el.textContent, s.color, s.backgroundColor]; })`);
      for (const [text, fg, bg] of pairs) {
        const rgb = (c) => c.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number);
        const lum = (c) => { const [r, g, b] = rgb(c).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
        const [a, b] = [lum(fg), lum(bg)];
        const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
        ratios.push(ratio);
        expect(ratio >= 4.5, `${path} "${text}": ${ratio.toFixed(2)}:1 (${fg} on ${bg})`);
      }
    }
    return `${ratios.length} labels, lowest ${Math.min(...ratios).toFixed(2)}:1`;
  });

  await test('loader uses plain, friendly words (no sci-fi messages)', async () => {
    await send('Page.navigate', { url: BASE + '/' });
    const seen = new Set();
    for (let i = 0; i < 20; i++) {
      await sleep(120);
      const l = await ev(`document.querySelector('[data-loader-label]')?.textContent || ''`);
      if (l) seen.add(l);
    }
    const words = [...seen].join(' / ');
    expect(!/initialis|calibrat|systems|sensors|3D models/i.test(words), `loader says: ${words}`);
    expect(seen.size > 0, 'loader text not found');
    return words;
  });

  await test('Home: "Read the build log" in the Open design band opens /build-log', async () => {
    await goto('/', `document.querySelector('#open-design a[href="/build-log"]')`);
    const label = await ev(`document.querySelector('#open-design a[href="/build-log"]').textContent.trim()`);
    expect(label === 'Read the build log', `button text: ${label}`);
    await ev(`document.querySelector('#open-design a[href="/build-log"]').click()`);
    await waitFor(`location.pathname === '/build-log' && document.querySelector('main h1')?.textContent === 'Building Gajju Mini, week by week.'`, 'Build log opened');
    return label;
  });

  await test('SEO: robots.txt, sitemap rules, unique descriptions and Open Graph tags per page', async () => {
    const robots = await fetch(BASE + '/robots.txt');
    const body = await robots.text();
    expect(robots.ok && /text\/plain/.test(robots.headers.get('content-type') || ''), `robots.txt: ${robots.status} ${robots.headers.get('content-type')}`);
    expect(/^User-agent: \*$/m.test(body) && /^Allow: \/$/m.test(body), `robots.txt content:\n${body}`);
    if (!SHOP) for (const p of ['/shop', '/product/', '/cart', '/checkout']) expect(body.includes(`Disallow: ${p}`), `robots.txt does not block ${p}`);
    // No production domain is configured, so there is no sitemap and no Sitemap line (never guessed).
    const sitemap = await fetch(BASE + '/sitemap.xml');
    const sitemapIsXml = sitemap.ok && /xml/.test(sitemap.headers.get('content-type') || '');
    expect(!sitemapIsXml && !/^Sitemap:/m.test(body), 'a sitemap exists without a confirmed domain');
    // The generator itself, with an example domain: valid XML listing exactly the 7 Phase 1 pages.
    const { buildSitemap, buildRobots } = await import('../scripts/seo-files.mjs');
    // vite.config.js lists Object.keys(PAGES); every Phase 1 and Phase 2 page must be there.
    const { PAGES } = await import('../src/content/seo.js');
    expect(JSON.stringify(Object.keys(PAGES).sort()) === JSON.stringify([...ALL_PAGES].sort()), `seo PAGES: ${Object.keys(PAGES)}`);
    const xml = buildSitemap('https://example.invalid', ALL_PAGES);
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    expect(xml.startsWith('<?xml') && /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/.test(xml), 'sitemap XML header');
    expect(JSON.stringify(locs) === JSON.stringify(ALL_PAGES.map((p) => 'https://example.invalid' + p)), `sitemap URLs: ${locs}`);
    expect(/^Sitemap: https:\/\/example\.invalid\/sitemap\.xml$/m.test(buildRobots({ siteUrl: 'https://example.invalid' })), 'robots Sitemap line with a domain');
    // Per-page descriptions and Open Graph tags; no canonical/og:url without a domain.
    const descs = new Set();
    const titles = new Set();
    for (const path of ALL_PAGES) {
      await goto(path, `document.querySelector('main h1')`);
      await sleep(150);
      const m = await ev(`({ title: document.title, desc: document.querySelector('meta[name=description]').content, ogTitle: document.querySelector('meta[property="og:title"]')?.content, ogDesc: document.querySelector('meta[property="og:description"]')?.content, canonical: !!document.querySelector('link[rel=canonical]'), ogUrl: !!document.querySelector('meta[property="og:url"]') })`);
      expect(m.desc && m.ogTitle === m.title && m.ogDesc === m.desc, `${path}: ${JSON.stringify(m)}`);
      expect(!m.canonical && !m.ogUrl, `${path}: domain-dependent tags present without a confirmed domain`);
      descs.add(m.desc);
      titles.add(m.title);
    }
    expect(descs.size === ALL_PAGES.length && titles.size === ALL_PAGES.length, `${descs.size} unique descriptions, ${titles.size} titles for ${ALL_PAGES.length} pages`);
    return `robots.txt ok, ${descs.size} unique descriptions, sitemap waits for a domain`;
  });

  await test('3D model: optimised GLB is served and still loads in the viewer', async () => {
    const res = await fetch(BASE + '/models/gajju2_robot.glb');
    const bytes = (await res.arrayBuffer()).byteLength;
    expect(res.ok && bytes < 3_000_000, `GLB: ${res.status}, ${bytes} bytes`);
    await goto('/gajju-mini', `document.querySelector('.gj-viewer')`);
    await ev(`document.querySelector('.gj-viewer').scrollIntoView()`);
    await waitFor(`document.querySelectorAll('.gj-groups button').length === 8 && !document.querySelector('.gj-viewer .gj-stage-status')`, 'viewer loaded the model', 30000);
    return `${(bytes / 1048576).toFixed(2)} MB`;
  });

  await test('Phase 1 and Phase 2 pages: no horizontal overflow at 1440, 820 and 390 px', async () => {
    const bad = [];
    for (const [w, h, mobile] of [[1440, 900, false], [820, 1180, true], [390, 844, true]]) {
      await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile });
      for (const path of ALL_PAGES) {
        await goto(path, `document.querySelector('main h1')`);
        const o = await ev('document.documentElement.scrollWidth - innerWidth');
        if (o > 0) bad.push(`${path}@${w}: ${o}px`);
      }
    }
    await send('Emulation.clearDeviceMetricsOverride');
    expect(bad.length === 0, bad.join(', '));
    return `${ALL_PAGES.length} pages × 3 widths`;
  });
} catch (e) {
  failures++;
  console.error('\nSetup failed:', e.message || e);
} finally {
  try { ws?.close(); } catch {}
  cleanup();
}

console.log(failures ? `\n${failures} check(s) failed.` : '\nAll checks passed.');
if (!SHOP) console.log('(Phase 4 shop checks skipped in this build; run `npm run test:shop` for them.)');
setTimeout(() => process.exit(failures ? 1 : 0), 700);
