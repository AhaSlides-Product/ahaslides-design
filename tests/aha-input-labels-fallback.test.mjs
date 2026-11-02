import { test } from 'node:test';
import assert from 'node:assert/strict';

globalThis.HTMLElement ??= class {};
const registry = new Map();
globalThis.customElements ??= { get: (tag) => registry.get(tag), define: (tag, element) => registry.set(tag, element) };
await import('../lib/aha-button.js');
const { defineAhaInput } = await import('../lib/aha-input.js');
defineAhaInput('aha-input-under-test');
const AhaInput = registry.get('aha-input-under-test');

function inputWithInternals(internals) {
  const input = Object.create(AhaInput.prototype);
  input._internals = internals;
  return input;
}

test('labels is an empty list when the environment gives internals without labels', () => {
  assert.deepEqual([...inputWithInternals({}).labels], []);
});

test('labels is an empty list when there are no internals', () => {
  assert.deepEqual([...inputWithInternals(null).labels], []);
});

test('_syncName does not throw when internals has no labels', () => {
  const attributes = new Map();
  const field = { setAttribute: (name, value) => attributes.set(name, value), removeAttribute: (name) => attributes.delete(name) };
  const label = {};
  const input = inputWithInternals({});
  input.shadowRoot = { querySelector: (selector) => (selector === '.field' ? field : label) };
  input.getAttribute = () => null;
  assert.doesNotThrow(() => input._syncName());
  assert.equal(attributes.has('aria-label'), false);
});

test('labels still come from internals when present', () => {
  const labels = [{ textContent: ' Name ' }];
  assert.equal(inputWithInternals({ labels }).labels, labels);
});
