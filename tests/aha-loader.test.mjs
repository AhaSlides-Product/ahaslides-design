import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const stub = () => {
  const attrs = new Map();
  return { attrs, setAttribute: (k, v) => attrs.set(k, String(v)), removeAttribute: k => attrs.delete(k) };
};
globalThis.HTMLElement = class {
  constructor() { this.attributes = new Map(); this.fired = []; }
  dispatchEvent(e) { this.fired.push(e); }
  attachShadow() {
    const nodes = { blur: stub(), liquid: stub(), logo: stub(), petals: [0, 1, 2, 3].map(stub), dots: Array.from({ length: 8 }, stub) };
    let html = '';
    this.shadowRoot = {
      nodes,
      get firstChild() { return html ? {} : null; },
      get innerHTML() { return html; },
      set innerHTML(v) { html = v; },
      querySelector: s => ({ '.goo-blur': nodes.blur, '.liquid': nodes.liquid, '.logo': nodes.logo })[s] ?? null,
      querySelectorAll: s => (s === '.petal' ? nodes.petals : nodes.dots),
    };
    return this.shadowRoot;
  }
  hasAttribute(n) { return this.attributes.has(n); }
  getAttribute(n) { return this.attributes.has(n) ? this.attributes.get(n) : null; }
  setAttribute(n, v) { this.attributes.set(n, String(v)); }
  removeAttribute(n) { this.attributes.delete(n); }
};
globalThis.customElements = { get: () => undefined, define: () => {} };
globalThis.document = { documentElement: { dataset: {} } };
let reduced = false;
globalThis.matchMedia = () => ({ matches: reduced });
const frames = new Set();
let nextFrame = 1, lastTick = null;
globalThis.requestAnimationFrame = cb => { const id = nextFrame++; frames.add(id); lastTick = cb; return id; };
globalThis.CustomEvent = class { constructor(type, init) { this.type = type; this.detail = init.detail; } };
globalThis.cancelAnimationFrame = id => frames.delete(id);

const { AhaLoader } = await import('../lib/aha-loader.js');

const mount = (attrs = {}) => {
  const el = new AhaLoader();
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  el.connectedCallback();
  return el;
};

test('variant: splash by default, the html dataset picks tiles, the attribute wins over it', () => {
  document.documentElement.dataset = {};
  assert.equal(mount().getAttribute('data-variant'), 'splash');
  document.documentElement.dataset = { ahaLoader: 'tiles' };
  const paged = mount();
  assert.equal(paged.getAttribute('data-variant'), 'tiles');
  assert.match(paged.shadowRoot.innerHTML, /loader-award/);
  assert.equal(mount({ variant: 'splash' }).getAttribute('data-variant'), 'splash');
  document.documentElement.dataset = {};
  assert.equal(mount({ variant: 'tiles' }).getAttribute('data-variant'), 'tiles');
});

test('the splash petals are the DS logo paths, filled from brand tokens', () => {
  const logo = [...readFileSync(new URL('../logo/thesplash.svg', import.meta.url), 'utf8').matchAll(/<path d="([^"]+)"/g)].map(m => m[1]);
  const html = mount().shadowRoot.innerHTML;
  assert.deepEqual([...html.matchAll(/class="petal \w+" d="([^"]+)"/g)].map(m => m[1]), logo);
  assert.match(html, /\.pink\{ fill:var\(--aha-vivid-pink-100,#E70E68\) \}/);
  assert.match(html, /\.purple\{ fill:var\(--aha-logo-purple,#6A1EBB\) \}/);
});

test('the loop starts on connect and is cancelled on disconnect', () => {
  reduced = false; frames.clear();
  const el = mount();
  assert.equal(frames.size, 1);
  el.disconnectedCallback();
  assert.equal(frames.size, 0);
  el.connectedCallback();
  assert.equal(frames.size, 1);
  el.disconnectedCallback();
  el.isConnected = false;
  el.setAttribute('variant', 'splash');
  el.attributeChangedCallback('variant');
  assert.equal(frames.size, 0);
  mount({ variant: 'tiles' });
  assert.equal(frames.size, 0);
});

test('reduced motion draws the finished logo once and never loops', () => {
  reduced = true; frames.clear();
  const el = mount({ label: 'Opening the editor…' });
  assert.equal(frames.size, 0);
  const { petals, dots, liquid } = el.shadowRoot.nodes;
  for (const p of petals) assert.equal(p.attrs.get('transform'), 'translate(410 340) rotate(0.00) scale(1.0000) translate(-410 -340)');
  for (const d of dots) assert.equal(d.attrs.get('r'), '0.00');
  assert.equal(liquid.attrs.has('filter'), false);
  assert.equal(el.getAttribute('role'), 'status');
  assert.equal(el.getAttribute('aria-label'), 'Opening the editor…');
  reduced = false;
});

test('logo-only paints the finished logo first, never draws the dot ring, and loops on the logo alone', () => {
  reduced = false; frames.clear();
  const el = mount({ 'logo-only': '' });
  const html = el.shadowRoot.innerHTML;
  assert.equal((html.match(/class="petal /g) || []).length, 4);
  assert.doesNotMatch(html, /<circle|class="dot/);
  assert.equal(el.shadowRoot.nodes.logo.attrs.get('transform'), 'rotate(0)');
  assert.equal(frames.size, 1);
  el.removeAttribute('logo-only');
  el.isConnected = true;
  el.attributeChangedCallback('logo-only');
  assert.match(el.shadowRoot.innerHTML, /class="dot/);
  document.documentElement.dataset = { ahaLoader: 'tiles' };
  assert.match(mount({ 'logo-only': '' }).shadowRoot.innerHTML, /loader-award/);
  document.documentElement.dataset = {};
});

test('cycleDone resolves after one full splash cycle and aha-loader-cycle fires per cycle', async () => {
  reduced = false; frames.clear();
  assert.equal(AhaLoader.CYCLE_MS, 3652);
  const el = mount();
  const t0 = performance.now();
  let done = false;
  el.cycleDone.then(() => { done = true; });
  lastTick(t0 + AhaLoader.CYCLE_MS - 50);
  await Promise.resolve();
  assert.equal(done, false);
  assert.equal(el.fired.length, 0);
  lastTick(t0 + AhaLoader.CYCLE_MS + 50);
  await Promise.resolve();
  assert.equal(done, true);
  assert.deepEqual(el.fired.map(e => [e.type, e.detail.count]), [['aha-loader-cycle', 1]]);
  lastTick(t0 + 2 * AhaLoader.CYCLE_MS + 50);
  assert.equal(el.fired.at(-1).detail.count, 2);
});

test('a cycle listener that removes the loader stops the loop', () => {
  reduced = false; frames.clear();
  const el = mount();
  el.dispatchEvent = e => { el.fired.push(e); el.disconnectedCallback(); };
  lastTick(performance.now() + AhaLoader.CYCLE_MS + 50);
  assert.equal(el.fired.length, 1);
  assert.equal(frames.size, 0);
});

test('cycleDone is already resolved under reduced motion, for tiles and for logo-only', async () => {
  reduced = true;
  await mount().cycleDone;
  reduced = false;
  await mount({ variant: 'tiles' }).cycleDone;
  await mount({ 'logo-only': '' }).cycleDone;
});
