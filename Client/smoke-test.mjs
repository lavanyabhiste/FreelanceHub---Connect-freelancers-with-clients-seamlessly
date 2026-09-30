/**
 * Runtime UI smoke test — sets up jsdom globals, loads the app through
 * Vite's SSR module loader, and renders every page with renderToString.
 * Run: npm run test:ui
 */
import { JSDOM } from 'jsdom';

// ── jsdom environment ────────────────────────────────────────────────────────
const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: 'http://localhost:5173/',
  pretendToBeVisual: true,
});

const w = dom.window;
const setGlobal = (key, value) => {
  try {
    Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
  } catch {
    globalThis[key] = value;
  }
};

setGlobal('window', w);
setGlobal('document', w.document);
setGlobal('navigator', w.navigator);
setGlobal('location', w.location);
setGlobal('history', w.history);
setGlobal('localStorage', w.localStorage);
setGlobal('sessionStorage', w.sessionStorage);
setGlobal('HTMLElement', w.HTMLElement);
setGlobal('HTMLCanvasElement', w.HTMLCanvasElement);
setGlobal('Element', w.Element);
setGlobal('Node', w.Node);
setGlobal('SVGElement', w.SVGElement);
setGlobal('Event', w.Event);
setGlobal('CustomEvent', w.CustomEvent);
setGlobal('getComputedStyle', w.getComputedStyle.bind(w));
setGlobal('requestAnimationFrame', (cb) => setTimeout(() => cb(Date.now()), 0));
setGlobal('cancelAnimationFrame', clearTimeout);
setGlobal('MutationObserver', w.MutationObserver);
setGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
setGlobal('IntersectionObserver', class {
  observe() {} unobserve() {} disconnect() {} takeRecords() { return []; }
});
setGlobal(
  'matchMedia',
  w.matchMedia?.bind(w) ||
    ((query) => ({
      matches: false,
      media: query,
      addListener() {},
      removeListener() {},
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent() { return false; },
    }))
);
// jsdom does not implement matchMedia — gsap's ScrollTrigger needs it on the
// window object itself, not just as a global.
if (typeof w.matchMedia !== 'function') {
  w.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() { return false; },
  });
}
// jsdom has no canvas backend unless the `canvas` package is installed
w.HTMLCanvasElement.prototype.getContext = () => null;

// ── load app through Vite ────────────────────────────────────────────────────
const { createServer } = await import('vite');
const server = await createServer({
  configFile: './vite.config.js',
  server: { middlewareMode: true, hmr: false },
  appType: 'custom',
  logLevel: 'error',
});

let results = [];
try {
  const mod = await server.ssrLoadModule('/src/__smoke.jsx');
  results = mod.runSmoke();
} catch (e) {
  console.error('FATAL — could not load/render app:', e);
  await server.close();
  process.exit(1);
}
await server.close();

// ── report ───────────────────────────────────────────────────────────────────
let failed = 0;
for (const r of results) {
  if (r.pass) {
    console.log(`PASS  ${r.name}`);
  } else {
    failed += 1;
    console.log(`FAIL  ${r.name} — ${r.error || `empty output (len=${r.html})`}`);
  }
}
console.log(`\n${results.length - failed}/${results.length} render checks passed`);
process.exit(failed ? 1 : 0);
