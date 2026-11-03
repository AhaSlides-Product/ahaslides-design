import { test } from 'node:test';
import assert from 'node:assert/strict';

class FakeNode {
  constructor(tag) {
    this.tagName = String(tag).toUpperCase();
    this.attrs = new Map();
    this.children = [];
    this.listeners = {};
    this.style = { setProperty: (k, v) => { this.style[k] = v; } };
    this.dataset = {};
    const classes = new Set();
    this.classList = { toggle: (c, on) => (on ? classes.add(c) : classes.delete(c)), contains: (c) => classes.has(c) };
  }
  setAttribute(k, v) { this.attrs.set(k, String(v)); if (this.attributeChangedCallback) this.attributeChangedCallback(); }
  getAttribute(k) { return this.attrs.has(k) ? this.attrs.get(k) : null; }
  hasAttribute(k) { return this.attrs.has(k); }
  appendChild(n) { this.children.push(n); return n; }
  append(...ns) { this.children.push(...ns); }
  addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); }
  dispatchEvent(e) { (this.listeners[e.type] || []).forEach((fn) => fn(e)); return true; }
  click() { this.dispatchEvent({ type: 'click' }); }
}

let observerCallback;
globalThis.MutationObserver = class { constructor(cb) { observerCallback = cb; } observe() {} disconnect() {} };
globalThis.HTMLElement = class extends FakeNode {
  constructor() { super('aha-avatar-group'); }
  attachShadow() { this.shadowRoot = new FakeNode('#shadow'); return this.shadowRoot; }
};
globalThis.document = { createElement: (tag) => new FakeNode(tag) };
globalThis.CustomEvent = class { constructor(type, init) { Object.assign(this, { type }, init); } };
globalThis.customElements = { get: () => undefined, define: () => {} };
const { AhaAvatarGroup } = await import('../lib/aha-avatar.js');

function mount(attrs, avatarCount) {
  const el = new AhaAvatarGroup();
  for (const [k, v] of Object.entries(attrs)) el.attrs.set(k, v);
  for (let i = 0; i < avatarCount; i++) el.children.push(new FakeNode('aha-avatar'));
  el.connectedCallback();
  return { el, add: el._add };
}

test('a group without add renders no add button', () => {
  const { add } = mount({ max: '3' }, 4);
  assert.equal(add.hidden, true);
});

test('add fires a bubbling, composed aha-add on click, and not when disabled', () => {
  const { el, add } = mount({ add: '', 'add-label': 'Invite people' }, 2);
  const events = [];
  el.addEventListener('aha-add', (e) => events.push(e));
  assert.equal(add.hidden, false);
  assert.equal(add.tagName, 'BUTTON');
  assert.equal(add.getAttribute('aria-label'), 'Invite people');
  add.click();
  assert.equal(events.length, 1);
  assert.equal(events[0].bubbles, true);
  assert.equal(events[0].composed, true);
  el.setAttribute('add-disabled', '');
  assert.equal(add.disabled, true);
  add.click();
  assert.equal(events.length, 1);
});

test('the add button follows the group size and shape', () => {
  const { add } = mount({ add: '', size: 'small', shape: 'square' }, 1);
  assert.equal(add.style.width, '24px');
  assert.equal(add.dataset.shape, 'square');
  assert.equal(add.getAttribute('aria-label'), 'Add person');
});

test('adding an avatar keeps the same add button node, so focus stays on it', () => {
  const { el, add } = mount({ add: '' }, 1);
  el.children.push(new FakeNode('aha-avatar'));
  observerCallback();
  assert.equal(el._add, add);
  assert.equal(el.shadowRoot.children.length, 2);
});
