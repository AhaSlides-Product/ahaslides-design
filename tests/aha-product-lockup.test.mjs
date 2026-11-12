import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const shapes = (svg, cls) => [...svg.matchAll(/<(path|rect)\s([^>]*?)\s*\/>/g)]
  .filter(([, , attrs]) => !cls || attrs.includes(`class="${cls}"`))
  .map(([, tag, attrs]) => `${tag} ${attrs.replace(/\s*class="[^"]*"/, '').trim()}`);

for (const [logo, wordmark, ink] of [
  ['logo/ahaslides-logo.svg', 'logo/ahaslides-wordmark.svg', 'cls-2'],
  ['logo/ahaslides-logo-white.svg', 'logo/ahaslides-wordmark-white.svg', 'cls-1'],
]) {
  test(`${wordmark} is the wordmark of ${logo}, path for path`, () => {
    const official = shapes(read(logo), ink).slice(0, 10);
    assert.equal(official.length, 10);
    assert.deepEqual(shapes(read(wordmark)), official);
  });
}

test('the lockup draws AhaSlides as the wordmark artwork, never as text', async () => {
  globalThis.HTMLElement = class {
    constructor() { this.attributes = new Map(); }
    attachShadow() {
      const host = this;
      const nodes = new Map();
      const node = () => ({ style: {}, classList: { toggle() {} }, attrs: new Map(),
        setAttribute(k, v) { this.attrs.set(k, v); }, getAttribute(k) { return this.attrs.get(k) ?? null; } });
      this.shadowRoot = {
        set innerHTML(html) { host.shadowHtml = html; },
        querySelector: (selector) => { if (!nodes.has(selector)) nodes.set(selector, node()); return nodes.get(selector); },
      };
      return this.shadowRoot;
    }
    getAttribute(name) { return this.attributes.has(name) ? this.attributes.get(name) : null; }
    setAttribute(name, value) { this.attributes.set(name, String(value)); }
  };
  globalThis.customElements = { get: () => undefined, define: () => {} };
  const { AhaProductLockup } = await import('../lib/aha-product-lockup.js');
  for (const tone of [null, 'inverse']) {
    const lockup = new AhaProductLockup();
    lockup.setAttribute('product', 'Docs');
    if (tone) lockup.setAttribute('tone', tone);
    lockup.connectedCallback();
    const visibleText = lockup.shadowHtml.replace(/<style>[\s\S]*?<\/style>/, '').replace(/<[^>]*>/g, '');
    assert.doesNotMatch(visibleText, /AhaSlides/);
    assert.match(lockup.shadowHtml, /<img class="word"/);
    const src = lockup.shadowRoot.querySelector('.word').getAttribute('src');
    assert.match(src, tone ? /logo\/ahaslides-wordmark-white\.svg$/ : /logo\/ahaslides-wordmark\.svg$/);
    assert.equal(lockup.shadowRoot.querySelector('.lockup').getAttribute('aria-label'), 'AhaSlides Docs');
  }
});
