import { test } from 'node:test';
import assert from 'node:assert/strict';

globalThis.HTMLElement = class {
  #attributes = new Map();
  getAttribute(name) { return this.#attributes.has(name) ? this.#attributes.get(name) : null; }
  setAttribute(name, value) { this.#attributes.set(name, String(value)); }
  removeAttribute(name) { this.#attributes.delete(name); }
  hasAttribute(name) { return this.#attributes.has(name); }
  attachShadow() { this.shadowRoot = {}; return this.shadowRoot; }
  attachInternals() { return null; }
  closest() { return null; }
};
globalThis.customElements ??= { get: () => undefined, define: () => {} };

const { upgradeProperties } = await import('../lib/upgrade-properties.js');
const { AhaCountedInput } = await import('../lib/aha-counted-input.js');
const { AhaCountedTextarea } = await import('../lib/aha-counted-textarea.js');
const { AhaInput } = await import('../lib/aha-input.js');
const { AhaRate } = await import('../lib/aha-rate.js');

test('upgradeProperties re-assigns an own property through the prototype setter', () => {
  const received = [];
  class Target { set value(next) { received.push(next); } }
  const target = new Target();
  Object.defineProperty(target, 'value', { value: 'typed', writable: true, configurable: true, enumerable: true });
  upgradeProperties(target, ['value']);
  assert.deepEqual(received, ['typed']);
  assert.equal(Object.hasOwn(target, 'value'), false);
});

test('upgradeProperties leaves properties without an own value alone', () => {
  const received = [];
  class Target { set value(next) { received.push(next); } }
  upgradeProperties(new Target(), ['value']);
  assert.deepEqual(received, []);
});

const controls = [
  ['aha-counted-input', AhaCountedInput, { value: 'hello' }, 'value'],
  ['aha-counted-textarea', AhaCountedTextarea, { value: 'hello' }, 'value'],
  ['aha-input', AhaInput, { value: 'hello' }, 'value'],
  ['aha-rate', AhaRate, { value: 3 }, 'value'],
];

for (const [tag, Element, properties, observed] of controls) {
  test(`${tag} routes a pre-upgrade property through its setter on connect`, () => {
    const element = new Element();
    for (const [name, value] of Object.entries(properties)) {
      Object.defineProperty(element, name, { value, writable: true, configurable: true, enumerable: true });
    }
    element._render = element._build = () => {};
    element.connectedCallback();
    for (const name of Object.keys(properties)) assert.equal(Object.hasOwn(element, name), false);
    assert.equal(element[observed], properties[observed]);
    assert.equal(element.hasAttribute(observed), true);
  });
}
