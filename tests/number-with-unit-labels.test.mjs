import { test } from 'node:test';
import assert from 'node:assert/strict';

class FakeElement {
  constructor() { this.attributes = new Map(); this.textContent = ''; this.disabled = false; this.value = ''; }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  getAttribute(name) { return this.attributes.has(name) ? this.attributes.get(name) : null; }
  removeAttribute(name) { this.attributes.delete(name); }
  hasAttribute(name) { return this.attributes.has(name); }
}
globalThis.HTMLElement ??= FakeElement;
const registry = new Map();
globalThis.customElements ??= { get: (tag) => registry.get(tag), define: (tag, element) => registry.set(tag, element) };
await import('../lib/aha-field-error.js');
const { AhaNumberWithUnit } = await import('../lib/aha-number-with-unit.js');

function mount(attributes = {}, ids = {}) {
  const host = Object.create(AhaNumberWithUnit.prototype);
  host.attributes = new Map(Object.entries(attributes));
  for (const method of ['setAttribute', 'getAttribute', 'removeAttribute', 'hasAttribute']) host[method] = FakeElement.prototype[method];
  host.getRootNode = () => ({ getElementById: (id) => ids[id] ?? null });
  const parts = { '.field': new FakeElement(), '.step-up': new FakeElement(), '.step-down': new FakeElement(), '.unit': new FakeElement(), '.msg': new FakeElement() };
  host.shadowRoot = { querySelector: (selector) => parts[selector] };
  host._sync();
  return { host, parts };
}

test('default stepper labels are English and the host stays the spinbutton', () => {
  const { host, parts } = mount({ value: '5' });
  assert.equal(parts['.step-up'].getAttribute('aria-label'), 'Increase');
  assert.equal(parts['.step-down'].getAttribute('aria-label'), 'Decrease');
  assert.equal(host.getAttribute('role'), 'spinbutton');
  assert.equal(parts['.field'].getAttribute('aria-label'), null);
});

test('custom stepper labels reach the buttons', () => {
  const { parts } = mount({ 'increase-label': 'Tăng', 'decrease-label': 'Giảm' });
  assert.equal(parts['.step-up'].getAttribute('aria-label'), 'Tăng');
  assert.equal(parts['.step-down'].getAttribute('aria-label'), 'Giảm');
});

test('aria-label is forwarded and the spinbutton role moves to the inner input', () => {
  const { host, parts } = mount({ 'aria-label': 'Time limit', value: '20', min: '5', max: '120' });
  const field = parts['.field'];
  assert.equal(field.getAttribute('aria-label'), 'Time limit');
  assert.equal(field.getAttribute('role'), 'spinbutton');
  assert.equal(field.getAttribute('aria-valuenow'), '20');
  assert.equal(field.getAttribute('aria-valuemin'), '5');
  assert.equal(field.getAttribute('aria-valuemax'), '120');
  assert.equal(host.getAttribute('role'), null);
});

test('aria-labelledby text and the label attribute name the input', () => {
  const labelled = mount({ 'aria-labelledby': 'a b' }, { a: { textContent: ' Time ' }, b: { textContent: 'limit' } });
  assert.equal(labelled.parts['.field'].getAttribute('aria-label'), 'Time limit');
  const plain = mount({ label: 'Points' });
  assert.equal(plain.parts['.field'].getAttribute('aria-label'), 'Points');
});

test('attribute changes after connect update labels and name without rebuilding', () => {
  const { host, parts } = mount({ value: '5' });
  const up = parts['.step-up'];
  host.setAttribute('increase-label', 'Plus');
  host.setAttribute('aria-label', 'Seconds');
  host._sync();
  assert.equal(parts['.step-up'], up);
  assert.equal(up.getAttribute('aria-label'), 'Plus');
  assert.equal(parts['.field'].getAttribute('aria-label'), 'Seconds');
  assert.equal(host.getAttribute('role'), null);
  host.removeAttribute('aria-label');
  host._sync();
  assert.equal(parts['.field'].getAttribute('aria-label'), null);
  assert.equal(parts['.field'].getAttribute('role'), null);
  assert.equal(host.getAttribute('role'), 'spinbutton');
});

test('observed attributes include the label attributes', () => {
  for (const name of ['increase-label', 'decrease-label', 'aria-label', 'aria-labelledby', 'label']) {
    assert.ok(AhaNumberWithUnit.observedAttributes.includes(name), name);
  }
});
