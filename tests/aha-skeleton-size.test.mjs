import { test } from 'node:test';
import assert from 'node:assert/strict';

globalThis.document = { createRange: () => ({ createContextualFragment: (html) => ({ html }) }) };
globalThis.HTMLElement = class {
  constructor() { this.attributes = new Map(); }
  attachShadow() {
    const host = this;
    this.shadowRoot = {
      firstChild: null,
      append(fragment) { host.rendered = fragment.html; },
      removeChild() {},
    };
    return this.shadowRoot;
  }
  getAttribute(name) { return this.attributes.has(name) ? this.attributes.get(name) : null; }
};
globalThis.customElements = { get: () => undefined, define: () => {} };
const { AhaSkeleton } = await import('../lib/aha-skeleton.js');

function render(attributes) {
  const element = new AhaSkeleton();
  for (const [name, value] of Object.entries(attributes)) element.attributes.set(name, value);
  element.connectedCallback();
  return element.rendered;
}

test('without width or height no size override is emitted', () => {
  assert.ok(!render({ variant: 'title' }).includes(':host{--_'));
});

test('a bare number is pixels and a CSS length passes through', () => {
  const html = render({ variant: 'image', height: '120', width: '50%' });
  assert.ok(html.includes(':host{--_w:50%;--_h:120px;}'));
});

test('a value that is not a length is ignored, so no CSS can be injected', () => {
  const html = render({ variant: 'text', width: '10px;background:red', height: 'tall' });
  assert.ok(!html.includes(':host{--_'));
});
