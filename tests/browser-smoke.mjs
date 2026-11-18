// Browser smoke test for the built site (dist/).
//
// Starts `vite preview`, opens headless Chrome over the DevTools protocol (no extra npm
// packages), walks the main routes and flows, and fails on any failed check or any console
// error, warning or uncaught exception.
//
//   npm run build && npm run test:browser      (or simply: npm test)
//
// Env: CHROME_PATH (if Chrome isn't found automatically), TEST_PORT (default 4180).
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

if (!existsSync(join(ROOT, 'dist', 'index.html'))) {
  console.error('dist/ not found. Run `npm run build` first (or use `npm test`).');
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
  [join(ROOT, 'node_modules/vite/bin/vite.js'), 'preview', '--port', String(PORT), '--strictPort'],
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

  console.log(`Smoke test against ${BASE} using ${chromePath}\n`);

  // Start every run with an empty cart / saved state.
  await goto('/', `document.querySelector('#root')?.children.length`);
  await ev(`localStorage.clear()`);

  /* ---------- routes ---------- */
  await test('/ (home) renders', async () => {
    await goto('/', `document.querySelector('.hero__title')`, 'hero title');
    const r = await ev(`({
      title: document.title,
      sections: [...document.querySelectorAll('main section[id]')].map((s) => s.id),
      cards: document.querySelectorAll('.showcase article').length,
      header: !!document.querySelector('header'), footer: !!document.querySelector('footer'),
    })`);
    expect(r.title, 'missing document title');
    expect(r.header && r.footer, 'header or footer missing');
    expect(r.cards >= 1, 'no product cards in the showcase');
    for (const id of ['top', 'products']) expect(r.sections.includes(id), `section #${id} missing`);
    return `${r.sections.length} sections, ${r.cards} cards`;
  });

  await test('/shop renders products and sorts', async () => {
    await goto('/shop', `document.querySelectorAll('main article').length >= 1`, 'shop products');
    await ev(`(() => { const s = document.querySelector('main select'); s.value = 'price-asc'; s.dispatchEvent(new Event('change', { bubbles: true })); })()`);
    await sleep(200);
    const prices = await ev(`[...document.querySelectorAll('main article')].map((a) => Number((a.textContent.match(/₹\\s?([\\d,]+)/) || [,'0'])[1].replace(/,/g, '')))`);
    expect(prices.length >= 1, 'no products');
    expect(prices.every((p, i) => i === 0 || prices[i - 1] <= p), `not sorted ascending: ${prices}`);
    return `${prices.length} products`;
  });

  for (const id of ['GAJJU', 'GAJJU-kit']) {
    await test(`/product/${id} renders`, async () => {
      await goto(`/product/${id}`, `document.querySelector('main h1')`, 'product heading');
      const r = await ev(`({ h1: document.querySelector('main h1').textContent, thumbs: document.querySelectorAll('.thumb').length, add: !!document.querySelector('.review-form') })`);
      expect(/gajju/i.test(r.h1), `unexpected heading: ${r.h1}`);
      expect(r.thumbs >= 1, 'no gallery thumbnails');
      return r.h1;
    });
  }

  await test('/product/:id with an unknown id shows "not found"', async () => {
    await goto('/product/does-not-exist', `document.querySelector('main h1')`);
    const h1 = await ev(`document.querySelector('main h1').textContent`);
    expect(/not found|couldn.t find|no product/i.test(h1), `unexpected heading: ${h1}`);
    return h1;
  });

  await test('add to cart from /shop opens the drawer', async () => {
    await goto('/shop', `document.querySelector('main article button')`);
    await ev(`document.querySelector('main article button').click()`);
    await waitFor(`document.querySelector('[data-panel=cart]')?.classList.contains('is-open')`, 'cart drawer to open');
    const count = await ev(`document.querySelector('.cart-count')?.textContent.trim()`);
    expect(count === '1', `cart count is ${count}`);
    return `cart count ${count}`;
  });

  await test('/cart shows the line, quantity and promo work', async () => {
    await goto('/cart', `document.querySelectorAll('.cart-page .line').length >= 1`, 'cart line');
    await ev(`document.querySelector('.cart-page .qty button[aria-label="Increase quantity"]').click()`);
    await waitFor(`document.querySelector('.cart-count')?.textContent.trim() === '2'`, 'quantity to become 2');
    await setValue('#promo', 'NEX10');
    await ev(`document.querySelector('#promo').form.requestSubmit()`);
    await waitFor(`/NEX10|discount|10%/i.test(document.querySelector('.summary')?.textContent || '')`, 'promo to apply');
    return 'qty 2, NEX10 applied';
  });

  await test('/checkout validates, then places an order', async () => {
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
  await test('in-app link navigation (page curtain) reaches /shop', async () => {
    await goto('/', `document.querySelector('a[href="/shop"]')`);
    await ev(`document.querySelector('a[href="/shop"]').click()`);
    await waitFor(`location.pathname === '/shop' && document.querySelectorAll('main article').length >= 1`, 'navigation to /shop');
    await waitFor(`document.querySelectorAll('.hero__stage canvas').length === 0`, 'home 3D scene torn down');
  });

  await test('legacy URLs redirect', async () => {
    const cases = { '/shop.html': '/shop', '/product.html?id=GAJJU': '/product/GAJJU', '/cart.html': '/cart', '/checkout.html': '/checkout', '/index.html': '/' };
    for (const [from, to] of Object.entries(cases)) {
      await goto(from, `location.pathname === ${JSON.stringify(to)}`, `${from} → ${to}`);
    }
    return Object.keys(cases).length + ' redirects';
  });

  await test('unknown route goes home', async () => {
    await goto('/no-such-page', `location.pathname === '/'`);
  });
} catch (e) {
  failures++;
  console.error('\nSetup failed:', e.message || e);
} finally {
  try { ws?.close(); } catch {}
  cleanup();
}

console.log(failures ? `\n${failures} check(s) failed.` : '\nAll checks passed.');
setTimeout(() => process.exit(failures ? 1 : 0), 700);
