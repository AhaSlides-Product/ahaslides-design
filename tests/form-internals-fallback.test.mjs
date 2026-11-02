import { test } from 'node:test';
import assert from 'node:assert/strict';

let nextInternals = null;
globalThis.HTMLElement = class {
  attachInternals() { return nextInternals; }
  closest() { return null; }
};
globalThis.customElements ??= { get: () => undefined, define: () => {} };
const { AhaButton } = await import('../lib/aha-button.js');
const { AhaInput } = await import('../lib/aha-input.js');

for (const [name, Element] of [['aha-input', AhaInput], ['aha-button', AhaButton]]) {
  test(`${name} ignores internals without a form API, as jsdom gives`, () => {
    nextInternals = { role: null };
    const element = new Element();
    assert.equal(element._internals, null);
    assert.equal(element.form, null);
  });

  test(`${name} keeps form-associated internals`, () => {
    const form = {};
    nextInternals = { setFormValue() {}, form, labels: [] };
    const element = new Element();
    assert.equal(element._internals, nextInternals);
    assert.equal(element.form, form);
  });
}

test('aha-input syncs its value without throwing when internals were ignored', () => {
  nextInternals = { role: null };
  const input = new AhaInput();
  assert.deepEqual([...input.labels], []);
});
