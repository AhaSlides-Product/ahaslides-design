import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const stub = () => {
  const attrs = new Map();
  return { attrs, setAttribute: (k, v) => attrs.set(k, String(v)), removeAttribute: k => attrs.delete(k) };
};
globalThis.HTMLElement = class {
  constructor() { this.attributes = new Map(); }
  attachShadow() {
    const nodes = { blur: stub(), liquid: stub(), petals: [0, 1, 2, 3].map(stub), dots: Array.from({ length: 8 }, stub) };
    let html = '';
    this.shadowRoot = {
      nodes,
      get firstChild() { return html ? {} : null; },
      get innerHTML() { return html; },
      set innerHTML(v) { html = v; },
      querySelector: s => (s === 'feGaussianBlur' ? nodes.blur : nodes.liquid),
      querySelectorAll: s => (s === '.petal' ? nodes.petals : nodes.dots),
    };
    return this.shadowRoot;
  }
  getAttribute(n) { return this.attributes.has(n) ? this.attributes.get(n) : null; }
  setAttribute(n, v) { this.attributes.set(n, String(v)); }
  removeAttribute(n) { this.attributes.delete(n); }
};
globalThis.customElements = { get: () => undefined, define: () => {} };
globalThis.document = { documentElement: { dataset: {} } };
let reduced = false;
globalThis.matchMedia = () => ({ matches: reduced });
const frames = new Set();
let nextFrame = 1;
globalThis.requestAnimationFrame = () => { const id = nextFrame++; frames.add(id); return id; };
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
