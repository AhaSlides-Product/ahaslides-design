import { test } from 'node:test';
import assert from 'node:assert/strict';

const PAYLOAD = '<img src=x onerror="alert(1)">';
const BREAKOUT = `"><img src=x onerror="alert(1)">`;
const recordedHtml = [];
const recordedText = [];

// Any node the render touches: innerHTML and textContent writes are recorded, every other read or call is a no-op.
function inertNode() {
  const node = new Proxy(function inert() {}, {
    get: (_target, key) => {
      if (key === Symbol.toPrimitive) return () => '';
      if (key === Symbol.iterator) return [][Symbol.iterator];
      if (key === 'length') return 0;
      return node;
    },
    set: (_target, key, value) => {
      if (key === 'innerHTML') recordedHtml.push(String(value));
      if (key === 'textContent') recordedText.push(String(value));
      return true;
    },
    apply: () => node,
  });
  return node;
}

globalThis.HTMLElement = class {
  constructor() { this.attributes = new Map(); }
  attachShadow() {
    this.shadowRoot = {
      set innerHTML(html) { recordedHtml.push(html); },
      querySelector: () => inertNode(),
      querySelectorAll: () => [],
      appendChild() {},
      addEventListener() {},
    };
    return this.shadowRoot;
  }
  querySelectorAll() { return this.lightPanels || []; }
  get children() { return []; }
  getAttribute(name) { return this.attributes.has(name) ? this.attributes.get(name) : null; }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  removeAttribute(name) { this.attributes.delete(name); }
  hasAttribute(name) { return this.attributes.has(name); }
  addEventListener() {}
  removeEventListener() {}
};
globalThis.customElements = { get: () => undefined, define: () => {} };
globalThis.document = { createElement: () => inertNode() };

const cases = [
  { module: '../lib/aha-card.js', exportName: 'AhaCard', attributes: { 'card-title': PAYLOAD }, via: 'text' },
  { module: '../lib/aha-rate.js', exportName: 'AhaRate', attributes: { icon: PAYLOAD } },
  { module: '../lib/aha-card-select.js', exportName: 'AhaCardSelect', attributes: { options: JSON.stringify([{ value: 'a', label: 'A', icon: PAYLOAD }]) } },
  { module: '../lib/aha-descriptions.js', exportName: 'AhaDescriptions', attributes: { items: JSON.stringify([{ label: 'Question', value: PAYLOAD }]) } },
  {
    module: '../lib/aha-tabs.js', exportName: 'AhaTabs', attributes: {}, what: 'a panel id',
    setup: (element) => { element.lightPanels = [{ id: BREAKOUT, getAttribute: () => 'Tab', hasAttribute: () => false, setAttribute() {} }]; },
  },
];

for (const { module, exportName, attributes, what, setup, via = 'markup' } of cases) {
  test(`${exportName} renders ${what || Object.keys(attributes).join(', ')} as literal text`, async () => {
    const { [exportName]: Element } = await import(module);
    const element = new Element();
    for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
    setup?.(element);
    recordedHtml.length = 0;
    recordedText.length = 0;
    element.connectedCallback();
    const html = recordedHtml.join('\n');
    assert.ok(!/<img/i.test(html), `markup creates an <img> element: ${html}`);
    const literal = via === 'text'
      ? recordedText.some((text) => text.includes(PAYLOAD))
      : html.includes('&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
    assert.ok(literal, `payload is missing as literal text (${via})`);
  });
}
