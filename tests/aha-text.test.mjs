import { test } from 'node:test';
import assert from 'node:assert/strict';

const observers = [];
globalThis.MutationObserver = class {
  constructor(callback) { this.callback = callback; this.options = null; this.connected = false; observers.push(this); }
  observe(_target, options) { this.options = options; this.connected = true; }
  disconnect() { this.connected = false; }
};
const slot = { addEventListener() {} };
const styleLines = { textContent: '' };
globalThis.HTMLElement = class {
  constructor() { this.attributes = new Map(); this.text = ''; }
  attachShadow() {
    const host = this;
    this.shadowRoot = {
      set innerHTML(html) { host.shadowHtml = html; },
      querySelector: (selector) => (selector === 'slot' ? slot : styleLines),
    };
    return this.shadowRoot;
  }
  getAttribute(name) { return this.attributes.has(name) ? this.attributes.get(name) : null; }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  removeAttribute(name) { this.attributes.delete(name); }
  hasAttribute(name) { return this.attributes.has(name); }
  get textContent() { return this.text; }
};
globalThis.customElements = { get: () => undefined, define: () => {} };
const { AhaText } = await import('../lib/aha-text.js');

test('hidden wins over every display variant', () => {
  const element = new AhaText();
  element.connectedCallback();
  assert.match(element.shadowHtml, /:host\(\[hidden\]\)\{ display:none !important \}/);
});

test('truncation title follows a text node edit that changes no box size', () => {
  const element = new AhaText();
  Object.assign(element, { scrollWidth: 200, clientWidth: 100, scrollHeight: 20, clientHeight: 20 });
  element.setAttribute('ellipsis', '');
  element.text = 'First long course title';
  element.connectedCallback();
  assert.equal(element.getAttribute('title'), 'First long course title');
  const observer = observers.at(-1);
  assert.deepEqual(observer.options, { childList: true, characterData: true, subtree: true });
  element.text = 'Second long course title';
  observer.callback();
  assert.equal(element.getAttribute('title'), 'Second long course title');
});

test('the text observer stops when the element leaves the page', () => {
  const element = new AhaText();
  element.connectedCallback();
  const observer = observers.at(-1);
  assert.equal(observer.connected, true);
  element.disconnectedCallback();
  assert.equal(observer.connected, false);
});
