import { test } from 'node:test';
import assert from 'node:assert/strict';

globalThis.MutationObserver = class { observe() {} disconnect() {} };
globalThis.HTMLElement = class {
  constructor() { this.attributes = new Map(); }
  attachShadow() {
    const host = this;
    this.shadowRoot = {
      set innerHTML(html) {
        host.shadowHtml = html;
        host.img = /<img /.test(html) ? { listeners: {}, addEventListener(type, fn) { this.listeners[type] = fn; } } : null;
      },
      querySelector: (selector) => (selector === 'img' ? host.img : null),
    };
    return this.shadowRoot;
  }
  getAttribute(name) { return this.attributes.has(name) ? this.attributes.get(name) : null; }
  setAttribute(name, value) { this.attributes.set(name, String(value)); this.attributeChangedCallback(); }
};
globalThis.customElements = { get: () => undefined, define: () => {} };
const { AhaAvatar } = await import('../lib/aha-avatar.js');

function mount(attrs) {
  const el = new AhaAvatar();
  for (const [k, v] of Object.entries(attrs)) el.attributes.set(k, v);
  el.connectedCallback();
  return el;
}

test('a failed image shows the initials until src changes', () => {
  const el = mount({ src: 'https://example.invalid/x.jpg', name: 'Ada Lovelace' });
  assert.match(el.shadowHtml, /<img /);
  el.img.listeners.error();
  assert.doesNotMatch(el.shadowHtml, /<img /);
  assert.match(el.shadowHtml, />AL</);
  el.setAttribute('size', '64');
  assert.doesNotMatch(el.shadowHtml, /<img /);
  assert.match(el.shadowHtml, />AL</);
  el.setAttribute('src', 'https://example.invalid/y.jpg');
  assert.match(el.shadowHtml, /<img /);
});

test('a failed image falls back to the icon when icon is set', () => {
  const el = mount({ src: 'https://example.invalid/x.jpg', name: 'Ada Lovelace', icon: 'system-user' });
  el.img.listeners.error();
  assert.match(el.shadowHtml, /<aha-icon name="system-user"/);
});

test('an error from a replaced image does not blank the current one', () => {
  const el = mount({ src: 'https://example.invalid/x.jpg', name: 'Ada Lovelace' });
  const staleError = el.img.listeners.error;
  el.setAttribute('src', 'https://example.invalid/y.jpg');
  staleError();
  assert.match(el.shadowHtml, /<img /);
});
